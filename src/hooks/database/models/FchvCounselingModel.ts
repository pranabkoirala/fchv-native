import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface FchvCounselingStoreType {
  id: string;
  fchv_name: string | null;
  fchv_id: string | null;
  data: string | null;
  reg_year: number;
  reg_month: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getFchvCounseling(
  reg_year?: number,
  reg_month?: number,
): Promise<FchvCounselingStoreType | null> {
  const db = await getDb();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();
  const year = reg_year || currentYear;
  const month = reg_month || currentMonth;

  const result = await db.getFirstAsync<FchvCounselingStoreType>(
    `SELECT * FROM fchv_counseling WHERE reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [year, month],
  );
  return result || null;
}

export async function saveFchvCounseling(payload: {
  id?: string;
  fchv_name?: string | null;
  fchv_id?: string | null;
  data?: string | null;
  reg_year?: number;
  reg_month?: number;
}): Promise<FchvCounselingStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  const existing = await getFchvCounseling(regYear, regMonth);

  if (existing) {
    await db.runAsync(
      `UPDATE fchv_counseling
       SET fchv_name = ?, fchv_id = ?, data = ?, updated_at = ?, is_synced = 0
       WHERE id = ?`,
      [payload.fchv_name || null, payload.fchv_id || null, payload.data || null, now, existing.id],
    );
    return {
      ...existing,
      fchv_name: payload.fchv_name || null,
      fchv_id: payload.fchv_id || null,
      data: payload.data || null,
      updated_at: now,
      is_synced: 0,
    };
  } else {
    await db.runAsync(
      `INSERT INTO fchv_counseling (id, fchv_name, fchv_id, data, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.fchv_name || null, payload.fchv_id || null, payload.data || null, regYear, regMonth, now, now],
    );
    return {
      id,
      fchv_name: payload.fchv_name || null,
      fchv_id: payload.fchv_id || null,
      data: payload.data || null,
      reg_year: regYear,
      reg_month: regMonth,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}

const FCHV_COUNSELING_COLUMNS = [
  "id",
  "fchv_name",
  "fchv_id",
  "data",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getFchvCounselingValues = (
  item: Partial<FchvCounselingStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  },
) => [
  item.id ?? null,
  item.fchv_name ?? null,
  item.fchv_id ?? null,
  item.data ?? null,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function unSyncedFchvCounseling(): Promise<FchvCounselingStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<FchvCounselingStoreType>(
    `SELECT * FROM fchv_counseling WHERE is_synced = 0`,
  );
}

export async function insertToTempFchvCounselingTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "fchv_counseling_staging",
      columns: FCHV_COUNSELING_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        const rawData = item.data ?? null;
        const data = rawData !== null && typeof rawData === "object"
          ? JSON.stringify(rawData)
          : rawData;

        return getFchvCounselingValues(
          {
            id: item.id,
            fchv_name: item.fchv_name ?? null,
            fchv_id: item.fchv_id ?? null,
            data,
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

export async function moveTempToRealFchvCounselingTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<FchvCounselingStoreType>(
    `SELECT * FROM fchv_counseling_staging`,
  );

  if (!staged.length) return;

  const placeholders = FCHV_COUNSELING_COLUMNS.map(() => "?").join(", ");
  const updateSet = FCHV_COUNSELING_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO fchv_counseling (${FCHV_COUNSELING_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(fchv_counseling.updated_at)
         OR fchv_counseling.updated_at IS NULL;
      `,
      getFchvCounselingValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("fchv_counseling", new Date().toISOString());
}
