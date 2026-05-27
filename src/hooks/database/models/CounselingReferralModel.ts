import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";

export interface CounselingReferralStoreType {
  id: string;
  mother_id: string;
  answers: string | null; // JSON string of question ID to boolean
  reg_year: number;
  reg_month: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getCounselingReferralByMother(
  mother_id: string,
  reg_year: number = getCurrentNepaliDate().year,
  reg_month: number = getCurrentNepaliDate().month,
): Promise<CounselingReferralStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<CounselingReferralStoreType>(
    `SELECT * FROM counseling_referral WHERE mother_id = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [mother_id, reg_year, reg_month],
  );
  return result || null;
}

export async function saveCounselingReferral(payload: {
  id?: string;
  mother_id: string;
  answers: string | null;
  reg_year?: number;
  reg_month?: number;
}): Promise<CounselingReferralStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  const existing = await getCounselingReferralByMother(payload.mother_id, regYear, regMonth);

  if (existing) {
    await db.runAsync(
      `UPDATE counseling_referral 
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
      `INSERT INTO counseling_referral (id, mother_id, answers, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother_id, payload.answers ?? null, regYear, regMonth, now, now],
    );
    return {
      id,
      mother_id: payload.mother_id,
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

export async function getCounselingReferralHistory(
  mother_id: string,
): Promise<CounselingReferralStoreType[]> {
  const db = await getDb();
  const results = await db.getAllAsync<CounselingReferralStoreType>(
    `SELECT * FROM counseling_referral WHERE mother_id = ? AND is_deleted = 0 ORDER BY reg_year DESC, reg_month DESC`,
    [mother_id],
  );
  return results;
}
