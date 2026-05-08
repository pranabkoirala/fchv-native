import * as Crypto from 'expo-crypto';
import { getDb } from '../db';

export interface SupplementStoreType {
  id: string;
  mother_id: string;
  iron_pregnancy: number;
  iron_post_delivery: number;
  vitamin_a_post_delivery: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getSupplementByMother(mother_id: string): Promise<SupplementStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<SupplementStoreType>(
    `SELECT * FROM supplements WHERE mother_id = ? AND is_deleted = 0`,
    [mother_id]
  );
  return result || null;
}

export async function saveSupplement(payload: {
  mother_id: string;
  iron_pregnancy?: number;
  iron_post_delivery?: number;
  vitamin_a_post_delivery?: number;
}): Promise<SupplementStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  // First check if it exists
  const existing = await getSupplementByMother(payload.mother_id);

  if (existing) {
    // Update
    const newIronPreg = payload.iron_pregnancy !== undefined ? payload.iron_pregnancy : existing.iron_pregnancy;
    const newIronPost = payload.iron_post_delivery !== undefined ? payload.iron_post_delivery : existing.iron_post_delivery;
    const newVitA = payload.vitamin_a_post_delivery !== undefined ? payload.vitamin_a_post_delivery : existing.vitamin_a_post_delivery;

    await db.runAsync(
      `UPDATE supplements SET 
        iron_pregnancy = ?,
        iron_post_delivery = ?,
        vitamin_a_post_delivery = ?,
        updated_at = ?,
        is_synced = 0
       WHERE id = ?`,
      [newIronPreg, newIronPost, newVitA, now, existing.id]
    );

    return {
      ...existing,
      iron_pregnancy: newIronPreg,
      iron_post_delivery: newIronPost,
      vitamin_a_post_delivery: newVitA,
      updated_at: now,
      is_synced: 0
    };
  } else {
    // Insert
    await db.runAsync(
      `INSERT INTO supplements (
        id, mother_id, iron_pregnancy, iron_post_delivery, vitamin_a_post_delivery, 
        is_synced, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [
        id, 
        payload.mother_id, 
        payload.iron_pregnancy || 0, 
        payload.iron_post_delivery || 0, 
        payload.vitamin_a_post_delivery || 0, 
        now, 
        now
      ]
    );

    return {
      id,
      mother_id: payload.mother_id,
      iron_pregnancy: payload.iron_pregnancy || 0,
      iron_post_delivery: payload.iron_post_delivery || 0,
      vitamin_a_post_delivery: payload.vitamin_a_post_delivery || 0,
      is_synced: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now
    };
  }
}
