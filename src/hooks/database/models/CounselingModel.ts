import * as Crypto from 'expo-crypto';
import { getDb } from '../db';

export interface CounselingStoreType {
  id: string;
  mother_id: string;
  is_counseled: number; // 0 or 1
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getCounselingByMother(mother_id: string): Promise<CounselingStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<CounselingStoreType>(
    `SELECT * FROM counseling WHERE mother_id = ? AND is_deleted = 0`,
    [mother_id]
  );
  return result || null;
}

export async function saveCounseling(payload: {
  id?: string;
  mother_id: string;
  is_counseled: number;
}): Promise<CounselingStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  const existing = await getCounselingByMother(payload.mother_id);

  if (existing) {
    await db.runAsync(
      `UPDATE counseling 
       SET is_counseled = ?, updated_at = ?, is_synced = 0 
       WHERE mother_id = ?`,
      [payload.is_counseled, now, payload.mother_id]
    );
    return { ...existing, is_counseled: payload.is_counseled, updated_at: now };
  } else {
    await db.runAsync(
      `INSERT INTO counseling (id, mother_id, is_counseled, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother_id, payload.is_counseled, now, now]
    );
    return {
      id,
      mother_id: payload.mother_id,
      is_counseled: payload.is_counseled,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}
