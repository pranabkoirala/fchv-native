import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface ChildNutritionStoreType {
  id: string;
  mother: string;
  child: string;
  nutrition_names: string;
  balvita_packets: number;
  child_age_group?: string | null;
  times_per_month?: number | null;
  reg_year?: number | null;
  reg_month?: number | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface ChildNutritionPayload {
  mother: string;
  child: string;
  nutrition_names: string[];
  balvita_packets: number;
  child_age_group: string;
  times_per_month: number;
}

const CHILD_NUTRITION_COLUMNS = [
  "id",
  "mother",
  "child",
  "nutrition_names",
  "balvita_packets",
  "child_age_group",
  "times_per_month",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getChildNutritionValues = (
  item: Partial<ChildNutritionStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  },
) => [
  item.id ?? null,
  item.mother ?? null,
  item.child ?? null,
  item.nutrition_names ?? null,
  item.balvita_packets ?? 0,
  item.child_age_group ?? null,
  item.times_per_month ?? null,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function saveChildNutrition(
  payload: ChildNutritionPayload,
): Promise<ChildNutritionStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();
  const nutritionNamesJson = JSON.stringify(payload.nutrition_names);

  await db.runAsync(
    `INSERT INTO child_nutrition (
      id, mother, child, nutrition_names, balvita_packets,
      child_age_group, times_per_month,
      is_synced, is_deleted, reg_year, reg_month, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
    [
      id,
      payload.mother,
      payload.child,
      nutritionNamesJson,
      payload.balvita_packets,
      payload.child_age_group,
      payload.times_per_month,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    id,
    mother: payload.mother,
    child: payload.child,
    nutrition_names: nutritionNamesJson,
    balvita_packets: payload.balvita_packets,
    child_age_group: payload.child_age_group,
    times_per_month: payload.times_per_month,
    is_synced: 0,
    is_deleted: 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    created_at: now,
    updated_at: now,
  };
}

export async function getChildNutritionByMother(
  motherId: string,
): Promise<ChildNutritionStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<ChildNutritionStoreType>(
    `SELECT * FROM child_nutrition WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [motherId],
  );
}

export async function getChildNutritionByChild(
  childId: string,
): Promise<ChildNutritionStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<ChildNutritionStoreType>(
    `SELECT * FROM child_nutrition WHERE child = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [childId],
  );
}

export async function getChildNutritionCountByMonth(
  childId: string,
  year: number,
  month: number,
): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM child_nutrition
     WHERE child = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [childId, year, month],
  );
  return result?.count ?? 0;
}

export async function getAllChildNutrition(): Promise<
  (ChildNutritionStoreType & { mother_name?: string; baby_name?: string })[]
> {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT cn.*, 
            COALESCE(NULLIF(m.first_name, ''), '') || ' ' || COALESCE(NULLIF(m.last_name, ''), '') as mother_name,
            cm.baby_name
     FROM child_nutrition cn
     LEFT JOIN mother m ON m.id = cn.mother
     LEFT JOIN child_monitoring cm ON cm.id = cn.child
     WHERE cn.is_deleted = 0
     ORDER BY cn.created_at DESC`,
  );
}

export async function unSyncedChildNutrition(): Promise<
  ChildNutritionStoreType[]
> {
  const db = await getDb();
  return await db.getAllAsync<ChildNutritionStoreType>(
    `SELECT * FROM child_nutrition WHERE is_synced = 0`,
  );
}

export async function insertToTempChildNutritionTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "child_nutrition_staging",
      columns: CHILD_NUTRITION_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return getChildNutritionValues(
          {
            id: item.id,
            mother: item.mother ?? item.mother_id,
            child: item.child ?? item.child_id,
            nutrition_names: item.nutrition_names,
            balvita_packets: item.balvita_packets,
            child_age_group: item.child_age_group,
            times_per_month: item.times_per_month,
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

export async function moveTempToRealChildNutritionTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<ChildNutritionStoreType>(
    `SELECT * FROM child_nutrition_staging`,
  );

  if (!staged.length) return;

  const placeholders = CHILD_NUTRITION_COLUMNS.map(() => "?").join(", ");
  const updateSet = CHILD_NUTRITION_COLUMNS.filter(
    (column) => column !== "id",
  )
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO child_nutrition (${CHILD_NUTRITION_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(child_nutrition.updated_at)
         OR child_nutrition.updated_at IS NULL;
      `,
      getChildNutritionValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("child_nutrition", new Date().toISOString());
}
