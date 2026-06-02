import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
    CreateMothersGroupMeetingPayload,
    MothersGroupMeetingStoreType,
} from "../types/mothersGroupMeetingModal";

export async function createMothersGroupMeeting(
    payload: Omit<CreateMothersGroupMeetingPayload, "created_at" | "updated_at">,
): Promise<MothersGroupMeetingStoreType> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = payload.id || Crypto.randomUUID();
    const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

    await db.runAsync(
        `INSERT INTO mothers_group_meetings 
      (id, meeting_date, meeting_location, ward_no, attendees_count, discussed_topics, decisions, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            id,
            payload.meeting_date,
            payload.meeting_location,
            payload.ward_no ?? null,
            payload.attendees_count,
            JSON.stringify(payload.discussed_topics),
            JSON.stringify(payload.decisions),
            payload.is_synced ? 1 : 0,
            0,
            currentYear,
            currentMonth,
            now,
            now,
        ],
    );

    return {
        id,
        meeting_date: payload.meeting_date,
        meeting_location: payload.meeting_location,
        ward_no: payload.ward_no ?? null,
        attendees_count: payload.attendees_count,
        discussed_topics: JSON.stringify(payload.discussed_topics),
        decisions: JSON.stringify(payload.decisions),
        is_synced: payload.is_synced ? 1 : 0,
        is_deleted: 0,
        reg_year: currentYear,
        reg_month: currentMonth,
        created_at: now,
        updated_at: now,
    };
}

export async function getAllMothersGroupMeetings(): Promise<
    (Omit<MothersGroupMeetingStoreType, "discussed_topics" | "decisions"> & {
        discussed_topics: string[];
        decisions: string[];
    })[]
> {
    const db = await getDb();
    const query = `
    SELECT *
    FROM mothers_group_meetings
    WHERE is_deleted = 0
    ORDER BY meeting_date DESC, created_at DESC
  `;
    const rows = await db.getAllAsync<MothersGroupMeetingStoreType>(query);
    return rows.map((row) => ({
        ...row,
        discussed_topics: row.discussed_topics ? JSON.parse(row.discussed_topics) : [],
        decisions: row.decisions ? JSON.parse(row.decisions) : [],
    }));
}
