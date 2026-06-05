import * as Crypto from "expo-crypto";
import { getCurrentNepaliMonth } from "../../../utils/dateHelper";
import { getDb } from "../db";

export interface FamilyPlanningStoreType {
  id: string;
  mother_id: string;
  pregnancy_id: string | null;
  family_planning: string;
  ocp_qty: number;
  ecp_qty: number;
  condom_qty: number;
  reg_month?: string | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getFamilyPlanningByMother(
  mother_id: string,
  pregnancy_id?: string | null,
): Promise<FamilyPlanningStoreType | null> {
  const db = await getDb();
  let query = `SELECT * FROM family_planning WHERE mother_id = ? AND is_deleted = 0`;
  const params: any[] = [mother_id];

  if (pregnancy_id) {
    query += ` AND pregnancy_id = ?`;
    params.push(pregnancy_id);
  } else {
    query += ` AND pregnancy_id IS NULL`;
  }

  const result = await db.getFirstAsync<FamilyPlanningStoreType>(query, params);
  return result || null;
}

export async function saveFamilyPlanning(payload: {
  id?: string;
  mother_id: string;
  pregnancy_id?: string | null;
  family_planning: string;
  ocp_qty?: number;
  ecp_qty?: number;
  condom_qty?: number;
}): Promise<FamilyPlanningStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  const ocp_qty = payload.ocp_qty || 0;
  const ecp_qty = payload.ecp_qty || 0;
  const condom_qty = payload.condom_qty || 0;

  const existing = await getFamilyPlanningByMother(payload.mother_id, payload.pregnancy_id);

  if (existing) {
    await db.runAsync(
      `UPDATE family_planning 
       SET family_planning = ?, ocp_qty = ?, ecp_qty = ?, condom_qty = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
      [payload.family_planning, ocp_qty, ecp_qty, condom_qty, now, existing.id],
    );
    return {
      ...existing,
      family_planning: payload.family_planning,
      ocp_qty,
      ecp_qty,
      condom_qty,
      updated_at: now,
    };
  } else {
    await db.runAsync(
      `INSERT INTO family_planning (id, mother_id, pregnancy_id, family_planning, ocp_qty, ecp_qty, condom_qty, reg_month, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother_id, payload.pregnancy_id || null, payload.family_planning, ocp_qty, ecp_qty, condom_qty, getCurrentNepaliMonth(), now, now],
    );
    return {
      id,
      mother_id: payload.mother_id,
      pregnancy_id: payload.pregnancy_id || null,
      family_planning: payload.family_planning,
      ocp_qty,
      ecp_qty,
      condom_qty,
      reg_month: getCurrentNepaliMonth(),
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}
