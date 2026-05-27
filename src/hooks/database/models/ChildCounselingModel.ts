import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";

export interface ChildCounselingStoreType {
  id: string;
  child_id: string;
  answers: string | null; // JSON string of question ID to boolean
  reg_year: number;
  reg_month: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getChildCounselingByChild(
  child_id: string,
  reg_year: number = getCurrentNepaliDate().year,
  reg_month: number = getCurrentNepaliDate().month,
): Promise<ChildCounselingStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling WHERE child_id = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [child_id, reg_year, reg_month],
  );
  return result || null;
}

export async function saveChildCounseling(payload: {
  id?: string;
  child_id: string;
  answers: string | null;
  reg_year?: number;
  reg_month?: number;
}): Promise<ChildCounselingStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  // Check for existing record in this specific month/year
  const existing = await getChildCounselingByChild(payload.child_id, regYear, regMonth);

  if (existing) {
    await db.runAsync(
      `UPDATE child_counseling 
       SET answers = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
      [payload.answers ?? null, now, existing.id],
    );
    return {
      ...existing,
      answers: payload.answers ?? null,
      updated_at: now,
      is_synced: 0,
    };
  } else {
    const id = payload.id || Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO child_counseling (id, child_id, answers, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.child_id, payload.answers ?? null, regYear, regMonth, now, now],
    );
    return {
      id,
      child_id: payload.child_id,
      answers: payload.answers ?? null,
      reg_year: regYear,
      reg_month: regMonth,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}

export async function getChildCounselingHistory(
  child_id: string,
): Promise<ChildCounselingStoreType[]> {
  const db = await getDb();
  const results = await db.getAllAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling WHERE child_id = ? AND is_deleted = 0 ORDER BY reg_year DESC, reg_month DESC`,
    [child_id],
  );
  return results;
}
