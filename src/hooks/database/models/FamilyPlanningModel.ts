import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface FamilyPlanningStoreType {
  id: string;
  mother: string;
  pregnancy_id: string | null;
  family_planning: string;
  ocp_qty: number;
  ecp_qty: number;
  condom_qty: number;
  reg_year?: number | null;
  reg_month?: number | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getFamilyPlanningByMother(
  mother: string,
  pregnancy_id?: string | null,
): Promise<FamilyPlanningStoreType | null> {
  const db = await getDb();
  let query = `SELECT * FROM family_planning WHERE mother = ? AND is_deleted = 0`;
  const params: any[] = [mother];

  if (pregnancy_id) {
    query += ` AND (pregnancy_id IS NULL OR pregnancy_id = ?)`;
    params.push(pregnancy_id);
    query += ` ORDER BY CASE WHEN pregnancy_id = ? THEN 0 ELSE 1 END`;
    params.push(pregnancy_id);
  } else {
    query += ` AND pregnancy_id IS NULL`;
  }

  const result = await db.getFirstAsync<FamilyPlanningStoreType>(query, params);
  return result || null;
}

export async function getAllFamilyPlanning(): Promise<FamilyPlanningStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<FamilyPlanningStoreType>(
    `SELECT * FROM family_planning WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
}

export async function saveFamilyPlanning(payload: {
  id?: string;
  mother: string;
  pregnancy_id?: string | null;
  family_planning: string;
  ocp_qty?: number;
  ecp_qty?: number;
  condom_qty?: number;
}): Promise<FamilyPlanningStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const ocp_qty = payload.ocp_qty || 0;
  const ecp_qty = payload.ecp_qty || 0;
  const condom_qty = payload.condom_qty || 0;

  const existing = await getFamilyPlanningByMother(payload.mother, payload.pregnancy_id);

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
      `INSERT INTO family_planning (id, mother, pregnancy_id, family_planning, ocp_qty, ecp_qty, condom_qty, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.mother, payload.pregnancy_id || null, payload.family_planning, ocp_qty, ecp_qty, condom_qty, currentYear, currentMonth, now, now],
    );
    return {
      id,
      mother: payload.mother,
      pregnancy_id: payload.pregnancy_id || null,
      family_planning: payload.family_planning,
      ocp_qty,
      ecp_qty,
      condom_qty,
      reg_year: currentYear,
      reg_month: currentMonth,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}

const FAMILY_PLANNING_COLUMNS = [
  "id",
  "mother",
  "pregnancy_id",
  "family_planning",
  "ocp_qty",
  "ecp_qty",
  "condom_qty",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getFamilyPlanningValues = (
  item: Partial<FamilyPlanningStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  },
) => [
  item.id ?? null,
  item.mother ?? null,
  item.pregnancy_id ?? null,
  item.family_planning ?? null,
  item.ocp_qty ?? 0,
  item.ecp_qty ?? 0,
  item.condom_qty ?? 0,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function unSyncedFamilyPlanning(): Promise<FamilyPlanningStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<FamilyPlanningStoreType>(
    `SELECT * FROM family_planning WHERE is_synced = 0`,
  );
}

export async function insertToTempFamilyPlanningTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "family_planning_staging",
      columns: FAMILY_PLANNING_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return getFamilyPlanningValues(
          {
            id: item.id,
            mother: item.mother,
            pregnancy_id: item.pregnancy_id ?? null,
            family_planning: item.family_planning,
            ocp_qty: item.ocp_qty,
            ecp_qty: item.ecp_qty,
            condom_qty: item.condom_qty,
            reg_year: item.reg_year,
            reg_month: item.reg_month,
          },
          {
            isSynced: 1,
            isDeleted: deleted ? 1 : 0,
            createdAt,
            updatedAt,
          },
        );
      },
    },
    apiRes,
  );
}

export async function moveTempToRealFamilyPlanningTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<FamilyPlanningStoreType>(
    `SELECT * FROM family_planning_staging`,
  );

  if (!staged.length) return;

  const placeholders = FAMILY_PLANNING_COLUMNS.map(() => "?").join(", ");
  const updateSet = FAMILY_PLANNING_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO family_planning (${FAMILY_PLANNING_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(family_planning.updated_at)
         OR family_planning.updated_at IS NULL;
      `,
      getFamilyPlanningValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("family_planning", new Date().toISOString());
}
