import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
    CreateMothersGroupMeetingPayload,
    MothersGroupMeetingStoreType,
} from "../types/mothersGroupMeetingModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

function normalizeList(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(Array.isArray(parsed) ? parsed : [value]);
        } catch {
            return JSON.stringify(value.trim() ? [value] : []);
        }
    }
    return JSON.stringify([]);
}

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

export async function unSyncedMothersGroupMeetings(): Promise<MothersGroupMeetingStoreType[]> {
    const db = await getDb();
    return await db.getAllAsync<MothersGroupMeetingStoreType>(
        `SELECT * FROM mothers_group_meetings WHERE is_synced = 0`,
    );
}

export async function insertToTempMothersGroupMeetingTable(apiRes: any[]) {
    if (!apiRes.length) return;

    const db = await getDb();
    const columns = [
        "id",
        "meeting_date",
        "meeting_location",
        "ward_no",
        "attendees_count",
        "discussed_topics",
        "decisions",
        "reg_year",
        "reg_month",
        "is_synced",
        "is_deleted",
        "created_at",
        "updated_at",
    ];

    await bulkInsertToTempTable<any>(
        {
            db,
            table: "mothers_group_meetings_staging",
            columns,
            onConflict: "replace",
            rows: (item) => {
                const createdAt = item.created_at ?? new Date().toISOString();
                const updatedAt = item.updated_at ?? createdAt;
                const deleted = item.deleted ?? item.is_deleted ?? false;

                return [
                    item.id,
                    item.meeting_date,
                    item.meeting_location,
                    item.ward_no ?? null,
                    item.attendees_count ?? 0,
                    normalizeList(item.discussed_topics),
                    normalizeList(item.decisions),
                    item.reg_year ?? null,
                    item.reg_month ?? null,
                    1,
                    deleted ? 1 : 0,
                    createdAt,
                    updatedAt,
                ];
            },
        },
        apiRes,
    );
}

export async function moveTempToRealMothersGroupMeetingTable() {
    const db = await getDb();

    const staged = await db.getAllAsync<MothersGroupMeetingStoreType>(
        `SELECT * FROM mothers_group_meetings_staging`,
    );

    if (!staged.length) return;

    for (const item of staged) {
        await db.runAsync(
            `
            INSERT INTO mothers_group_meetings
              (id, meeting_date, meeting_location, ward_no, attendees_count, discussed_topics, decisions, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              meeting_date = excluded.meeting_date,
              meeting_location = excluded.meeting_location,
              ward_no = excluded.ward_no,
              attendees_count = excluded.attendees_count,
              discussed_topics = excluded.discussed_topics,
              decisions = excluded.decisions,
              reg_year = excluded.reg_year,
              reg_month = excluded.reg_month,
              is_synced = excluded.is_synced,
              is_deleted = excluded.is_deleted,
              created_at = excluded.created_at,
              updated_at = excluded.updated_at
            WHERE datetime(excluded.updated_at) > datetime(mothers_group_meetings.updated_at)
               OR mothers_group_meetings.updated_at IS NULL;
            `,
            [
                item.id,
                item.meeting_date,
                item.meeting_location,
                item.ward_no,
                item.attendees_count,
                item.discussed_topics,
                item.decisions,
                item.reg_year,
                item.reg_month,
                1,
                item.is_deleted ? 1 : 0,
                item.created_at,
                item.updated_at,
            ],
        );
    }

    const now = new Date().toISOString();
    await setSyncTimestamp("mothers_group_meetings", now);
}
