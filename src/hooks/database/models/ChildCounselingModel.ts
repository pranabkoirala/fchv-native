import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface ChildCounselingStoreType {
  id: string;
  child: string;
  answers: string | null; // JSON string of question ID to boolean
  reg_year: number;
  reg_month: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export async function getChildCounselingByChild(
  child: string,
  reg_year: number = getCurrentNepaliDate().year,
  reg_month: number = getCurrentNepaliDate().month,
): Promise<ChildCounselingStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling WHERE child = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`,
    [child, reg_year, reg_month],
  );
  return result || null;
}

export async function saveChildCounseling(payload: {
  id?: string;
  child: string;
  answers: string | null;
  reg_year?: number;
  reg_month?: number;
}): Promise<ChildCounselingStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  // Check for existing record in this specific month/year
  const existing = payload.id
    ? await db.getFirstAsync<ChildCounselingStoreType>(
      `SELECT * FROM child_counseling WHERE id = ? AND is_deleted = 0`,
      [payload.id],
    )
    : await getChildCounselingByChild(payload.child, regYear, regMonth);

  if (existing) {
    await db.runAsync(
      `UPDATE child_counseling 
       SET answers = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
      [payload.answers ?? null, now, existing.id],
    );
    return {
      ...existing,
      answers: payload.answers ?? null,
      updated_at: now,
      is_synced: 0,
    };
  } else {
    const id = payload.id || Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO child_counseling (id, child, answers, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, payload.child, payload.answers ?? null, regYear, regMonth, now, now],
    );
    return {
      id,
      child: payload.child,
      answers: payload.answers ?? null,
      reg_year: regYear,
      reg_month: regMonth,
      created_at: now,
      updated_at: now,
      is_synced: 0,
      is_deleted: 0,
    };
  }
}

export async function getChildCounselingHistory(
  child: string,
): Promise<ChildCounselingStoreType[]> {
  const db = await getDb();
  const results = await db.getAllAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling WHERE child = ? AND is_deleted = 0 ORDER BY reg_year DESC, reg_month DESC`,
    [child],
  );
  return results;
}

const CHILD_COUNSELING_COLUMNS = [
  "id",
  "child",
  "answers",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getChildCounselingValues = (
  item: Partial<ChildCounselingStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  },
) => [
  item.id ?? null,
  item.child ?? null,
  item.answers ?? null,
  item.reg_year ?? null,
  item.reg_month ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

export async function unSyncedChildCounseling(): Promise<ChildCounselingStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling WHERE is_synced = 0`,
  );
}

export async function insertToTempChildCounselingTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "child_counseling_staging",
      columns: CHILD_COUNSELING_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return getChildCounselingValues(
          {
            id: item.id,
            child: item.child ?? item.child_id ?? null,
            answers: item.answers ?? null,
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

export async function moveTempToRealChildCounselingTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<ChildCounselingStoreType>(
    `SELECT * FROM child_counseling_staging`,
  );

  if (!staged.length) return;

  const placeholders = CHILD_COUNSELING_COLUMNS.map(() => "?").join(", ");
  const updateSet = CHILD_COUNSELING_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO child_counseling (${CHILD_COUNSELING_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(child_counseling.updated_at)
          OR child_counseling.updated_at IS NULL;
      `,
      getChildCounselingValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  await setSyncTimestamp("child_counseling", new Date().toISOString());
}
