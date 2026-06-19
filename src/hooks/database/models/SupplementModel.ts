import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface SupplementStoreType {
  id: string;
  mother: string;
  pregnancy_id: string | null;
  iron_pregnancy: number;
  iron_post_delivery: number;
  vitamin_a_post_delivery: number;
  calcium: number;
  reg_year?: number | null;
  reg_month?: number | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

const SUPPLEMENT_COLUMNS = [
  "id",
  "mother",
  "pregnancy_id",
  "iron_pregnancy",
  "iron_post_delivery",
  "vitamin_a_post_delivery",
  "calcium",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getRelationId = (item: any, key: "mother" | "pregnancy") =>
  item[`${key}_id`] ??
  item[key]?.id ??
  (typeof item[key] === "string" ? item[key] : null);

const getSupplementValues = (
  item: Partial<SupplementStoreType>,
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
  item.iron_pregnancy ?? 0,
  item.iron_post_delivery ?? 0,
  item.vitamin_a_post_delivery ?? 0,
  item.calcium ?? 0,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function getSupplementByMother(
  mother: string,
  pregnancy_id?: string | null,
): Promise<SupplementStoreType | null> {
  const db = await getDb();
  let query = `SELECT * FROM supplements WHERE mother = ? AND is_deleted = 0`;
  const params: any[] = [mother];

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
  mother: string;
  pregnancy_id?: string | null;
  iron_pregnancy?: number;
  iron_post_delivery?: number;
  vitamin_a_post_delivery?: number;
  calcium?: number;
}): Promise<SupplementStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  // First check if it exists in this specific context (mother + pregnancy)
  const existing = await getSupplementByMother(payload.mother, payload.pregnancy_id);

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
        id, mother, pregnancy_id, iron_pregnancy, iron_post_delivery, vitamin_a_post_delivery, calcium,
        is_synced, is_deleted, reg_year, reg_month, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
      [
        id,
        payload.mother,
        payload.pregnancy_id || null,
        payload.iron_pregnancy || 0,
        payload.iron_post_delivery || 0,
        payload.vitamin_a_post_delivery || 0,
        payload.calcium || 0,
        currentYear,
        currentMonth,
        now,
        now,
      ],
    );

    return {
      id,
      mother: payload.mother,
      pregnancy_id: payload.pregnancy_id || null,
      iron_pregnancy: payload.iron_pregnancy || 0,
      iron_post_delivery: payload.iron_post_delivery || 0,
      vitamin_a_post_delivery: payload.vitamin_a_post_delivery || 0,
      calcium: payload.calcium || 0,
      is_synced: 0,
      is_deleted: 0,
      reg_year: currentYear,
      reg_month: currentMonth,
      created_at: now,
      updated_at: now,
    };
  }
}

export async function unSyncedSupplements(): Promise<SupplementStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<SupplementStoreType>(
    `SELECT * FROM supplements WHERE is_synced = 0`,
  );
}

export async function insertToTempSupplementTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "supplements_staging",
      columns: SUPPLEMENT_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return getSupplementValues(
          {
            id: item.id,
            mother: getRelationId(item, "mother"),
            pregnancy_id: getRelationId(item, "pregnancy"),
            iron_pregnancy: item.iron_pregnancy,
            iron_post_delivery: item.iron_post_delivery,
            vitamin_a_post_delivery: item.vitamin_a_post_delivery,
            calcium: item.calcium,
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

export async function moveTempToRealSupplementTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<SupplementStoreType>(
    `SELECT * FROM supplements_staging`,
  );

  if (!staged.length) return;

  const placeholders = SUPPLEMENT_COLUMNS.map(() => "?").join(", ");
  const updateSet = SUPPLEMENT_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO supplements (${SUPPLEMENT_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(supplements.updated_at)
         OR supplements.updated_at IS NULL;
      `,
      getSupplementValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("supplements", new Date().toISOString());
}
