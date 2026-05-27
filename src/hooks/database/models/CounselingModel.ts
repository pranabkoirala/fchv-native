import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";

export interface CounselingStoreType {
  id: string;
  mother_id: string;
  is_counseled: number; // 0 or 1
  counseled_topics: string | null;
  reg_year: number;
  reg_month: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getCounselingByMother(
  mother_id: string,
  reg_year: number = getCurrentNepaliDate().year,
  reg_month: number = getCurrentNepaliDate().month,
): Promise<CounselingStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<CounselingStoreType>(
    `SELECT * FROM counseling WHERE mother_id = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [mother_id, reg_year, reg_month],
  );
  return result || null;
}

export async function saveCounseling(payload: {
  id?: string;
  mother_id: string;
  is_counseled: number;
  counseled_topics?: string | null;
  reg_year?: number;
  reg_month?: number;
}): Promise<CounselingStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  const existing = await getCounselingByMother(payload.mother_id, regYear, regMonth);

  if (existing) {
    await db.runAsync(
      `UPDATE counseling 
       SET is_counseled = ?, counseled_topics = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
      [payload.is_counseled, payload.counseled_topics ?? null, now, existing.id],
    );
    return {
      ...existing,
      is_counseled: payload.is_counseled,
      counseled_topics: payload.counseled_topics ?? null,
      updated_at: now,
      is_synced: 0,
    };
  } else {
    const id = payload.id || Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO counseling (id, mother_id, is_counseled, counseled_topics, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother_id, payload.is_counseled, payload.counseled_topics ?? null, regYear, regMonth, now, now],
    );
    return {
      id,
      mother_id: payload.mother_id,
      is_counseled: payload.is_counseled,
      counseled_topics: payload.counseled_topics ?? null,
      reg_year: regYear,
      reg_month: regMonth,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}
