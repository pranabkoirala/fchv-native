import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  AbortionStoreType,
  CreateAbortionPayload,
} from "../types/abortionModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export async function saveAbortion(
  payload: Omit<CreateAbortionPayload, "id" | "created_at" | "updated_at"> & {
    id?: string;
  },
): Promise<AbortionStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const existing = await getAbortionByMotherAndPregnancy(
    payload.mother,
    payload.pregnancy ?? null,
  );

  if (existing) {
    await db.runAsync(
      `UPDATE abortion 
       SET aborted = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
      [payload.aborted ? 1 : 0, now, existing.id],
    );
    return {
      ...existing,
      aborted: payload.aborted ? 1 : 0,
      updated_at: now,
    };
  }

  await db.runAsync(
    `INSERT INTO abortion (id, mother, pregnancy, aborted, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      id,
      payload.mother,
      payload.pregnancy ?? null,
      payload.aborted ? 1 : 0,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    id,
    mother: payload.mother,
    pregnancy: payload.pregnancy ?? null,
    aborted: payload.aborted ? 1 : 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    is_synced: 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function getAbortionByMotherAndPregnancy(
  mother: string,
  pregnancy: string | null,
): Promise<AbortionStoreType | null> {
  const db = await getDb();
  let query = `SELECT * FROM abortion WHERE mother = ? AND is_deleted = 0`;
  const params: any[] = [mother];

  if (pregnancy) {
    query += ` AND pregnancy = ?`;
    params.push(pregnancy);
  } else {
    query += ` AND pregnancy IS NULL`;
  }

  return (await db.getFirstAsync<AbortionStoreType>(query, params)) || null;
}

export async function getAbortionByMother(
  mother: string,
): Promise<AbortionStoreType | null> {
  const db = await getDb();
  return (await db.getFirstAsync<AbortionStoreType>(
    `SELECT * FROM abortion WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1`,
    [mother],
  )) || null;
}

export async function getAllAbortions(): Promise<AbortionStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<AbortionStoreType>(
    `SELECT * FROM abortion WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
}

export async function unSyncedAbortions(): Promise<AbortionStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<AbortionStoreType>(
    `SELECT * FROM abortion WHERE is_synced = 0`,
  );
}

const ABORTION_COLUMNS = [
  "id",
  "mother",
  "pregnancy",
  "aborted",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getAbortionValues = (
  item: Partial<AbortionStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  },
) => [
  item.id ?? null,
  item.mother ?? null,
  item.pregnancy ?? null,
  item.aborted ?? 0,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function insertToTempAbortionTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "abortion_staging",
      columns: ABORTION_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return getAbortionValues(
          {
            id: item.id,
            mother: item.mother,
            pregnancy: item.pregnancy ?? null,
            aborted: item.aborted ?? 0,
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

export async function moveTempToRealAbortionTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<AbortionStoreType>(
    `SELECT * FROM abortion_staging`,
  );

  if (!staged.length) return;

  const placeholders = ABORTION_COLUMNS.map(() => "?").join(", ");
  const updateSet = ABORTION_COLUMNS.filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO abortion (${ABORTION_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(abortion.updated_at)
         OR abortion.updated_at IS NULL;
      `,
      getAbortionValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("abortion", new Date().toISOString());
}
