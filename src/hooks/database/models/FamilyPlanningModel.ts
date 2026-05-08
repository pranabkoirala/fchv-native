import * as Crypto from 'expo-crypto';
import { getDb } from '../db';

export interface FamilyPlanningStoreType {
  id: string;
  mother_id: string;
  family_planning: string;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getFamilyPlanningByMother(mother_id: string): Promise<FamilyPlanningStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<FamilyPlanningStoreType>(
    `SELECT * FROM family_planning WHERE mother_id = ? AND is_deleted = 0`,
    [mother_id]
  );
  return result || null;
}

export async function saveFamilyPlanning(payload: {
  id?: string;
  mother_id: string;
  family_planning: string;
}): Promise<FamilyPlanningStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  const existing = await getFamilyPlanningByMother(payload.mother_id);

  if (existing) {
    await db.runAsync(
      `UPDATE family_planning 
       SET family_planning = ?, updated_at = ?, is_synced = 0 
       WHERE mother_id = ?`,
      [payload.family_planning, now, payload.mother_id]
    );
    return { ...existing, family_planning: payload.family_planning, updated_at: now };
  } else {
    await db.runAsync(
      `INSERT INTO family_planning (id, mother_id, family_planning, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother_id, payload.family_planning, now, now]
    );
    return {
      id,
      mother_id: payload.mother_id,
      family_planning: payload.family_planning,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}
