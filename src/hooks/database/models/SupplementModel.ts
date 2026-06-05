import * as Crypto from "expo-crypto";
import { getCurrentNepaliMonth } from "../../../utils/dateHelper";
import { getDb } from "../db";

export interface SupplementStoreType {
  id: string;
  mother_id: string;
  pregnancy_id: string | null;
  iron_pregnancy: number;
  iron_post_delivery: number;
  vitamin_a_post_delivery: number;
  calcium: number;
  reg_month?: string | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getSupplementByMother(
  mother_id: string,
  pregnancy_id?: string | null,
): Promise<SupplementStoreType | null> {
  const db = await getDb();
  let query = `SELECT * FROM supplements WHERE mother_id = ? AND is_deleted = 0`;
  const params: any[] = [mother_id];

  if (pregnancy_id) {
    query += ` AND pregnancy_id = ?`;
    params.push(pregnancy_id);
  } else {
    query += ` AND pregnancy_id IS NULL`;
  }

  const result = await db.getFirstAsync<SupplementStoreType>(query, params);
  return result || null;
}

export async function saveSupplement(payload: {
  mother_id: string;
  pregnancy_id?: string | null;
  iron_pregnancy?: number;
  iron_post_delivery?: number;
  vitamin_a_post_delivery?: number;
  calcium?: number;
}): Promise<SupplementStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  // First check if it exists in this specific context (mother + pregnancy)
  const existing = await getSupplementByMother(payload.mother_id, payload.pregnancy_id);

  if (existing) {
    // Update
    const newIronPreg =
      payload.iron_pregnancy !== undefined
        ? payload.iron_pregnancy
        : existing.iron_pregnancy;
    const newIronPost =
      payload.iron_post_delivery !== undefined
        ? payload.iron_post_delivery
        : existing.iron_post_delivery;
    const newVitA =
      payload.vitamin_a_post_delivery !== undefined
        ? payload.vitamin_a_post_delivery
        : existing.vitamin_a_post_delivery;
    const newCalcium =
      payload.calcium !== undefined ? payload.calcium : existing.calcium;

    await db.runAsync(
      `UPDATE supplements SET 
        iron_pregnancy = ?,
        iron_post_delivery = ?,
        vitamin_a_post_delivery = ?,
        calcium = ?,
        updated_at = ?,
        is_synced = 0
       WHERE id = ?`,
      [newIronPreg, newIronPost, newVitA, newCalcium, now, existing.id],
    );

    return {
      ...existing,
      iron_pregnancy: newIronPreg,
      iron_post_delivery: newIronPost,
      vitamin_a_post_delivery: newVitA,
      calcium: newCalcium,
      updated_at: now,
      is_synced: 0,
    };
  } else {
    // Insert
    await db.runAsync(
      `INSERT INTO supplements (
        id, mother_id, pregnancy_id, iron_pregnancy, iron_post_delivery, vitamin_a_post_delivery, calcium,
        is_synced, is_deleted, reg_month, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
      [
        id,
        payload.mother_id,
        payload.pregnancy_id || null,
        payload.iron_pregnancy || 0,
        payload.iron_post_delivery || 0,
        payload.vitamin_a_post_delivery || 0,
        payload.calcium || 0,
        getCurrentNepaliMonth(),
        now,
        now,
      ],
    );

    return {
      id,
      mother_id: payload.mother_id,
      pregnancy_id: payload.pregnancy_id || null,
      iron_pregnancy: payload.iron_pregnancy || 0,
      iron_post_delivery: payload.iron_post_delivery || 0,
      vitamin_a_post_delivery: payload.vitamin_a_post_delivery || 0,
      calcium: payload.calcium || 0,
      is_synced: 0,
      is_deleted: 0,
      reg_month: getCurrentNepaliMonth(),
      created_at: now,
      updated_at: now,
    };
  }
}
