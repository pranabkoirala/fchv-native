import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";
import { ChildDeathRegistrationStoreType } from "../types/childDeathRegistration";

export async function getChildDeathRegistration(
  child: string,
): Promise<ChildDeathRegistrationStoreType | null> {
  const db = await getDb();
  return db.getFirstAsync<ChildDeathRegistrationStoreType>(
    `SELECT * FROM child_death_registration WHERE child = ? AND is_deleted = 0`,
    [child],
  );
}

export async function saveChildDeathRegistration(payload: {
  id?: string;
  child: string;
  death_status: number;
  reg_year?: number;
  reg_month?: number;
}): Promise<ChildDeathRegistrationStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();
  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  const existing = payload.id
    ? await db.getFirstAsync<ChildDeathRegistrationStoreType>(
        `SELECT * FROM child_death_registration WHERE id = ? AND is_deleted = 0`,
        [payload.id],
      )
    : await getChildDeathRegistration(payload.child);

  if (existing) {
    await db.runAsync(
      `UPDATE child_death_registration
       SET death_status = ?, updated_at = ?, is_synced = 0
       WHERE id = ?`,
      [payload.death_status, now, existing.id],
    );
    return {
      ...existing,
      death_status: payload.death_status,
      updated_at: now,
      is_synced: 0,
    };
  }

  const id = payload.id || Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO child_death_registration
     (id, child, death_status, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [id, payload.child, payload.death_status, regYear, regMonth, now, now],
  );

  return {
    id,
    child: payload.child,
    death_status: payload.death_status,
    reg_year: regYear,
    reg_month: regMonth,
    created_at: now,
    updated_at: now,
    is_synced: 0,
    is_deleted: 0,
  };
}

export async function deleteChildDeathRegistration(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE child_death_registration SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

const COLUMNS = [
  "id",
  "child",
  "death_status",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getValues = (
  item: Partial<ChildDeathRegistrationStoreType>,
  opts: { isSynced: number; isDeleted: number; createdAt: string; updatedAt: string },
) => [
  item.id ?? null,
  item.child ?? null,
  item.death_status ?? 0,
  item.reg_year ?? null,
  item.reg_month ?? null,
  opts.isSynced,
  opts.isDeleted,
  opts.createdAt,
  opts.updatedAt,
];

export async function unSyncedChildDeathRegistrations(): Promise<ChildDeathRegistrationStoreType[]> {
  const db = await getDb();
  return db.getAllAsync<ChildDeathRegistrationStoreType>(
    `SELECT * FROM child_death_registration WHERE is_synced = 0`,
  );
}

export async function insertToTempChildDeathRegistrationTable(apiRes: any[]) {
  if (!apiRes.length) return;
  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "child_death_registration_staging",
      columns: COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;
        return getValues(
          {
            id: item.id,
            child: item.child ?? item.child_id ?? null,
            death_status: item.death_status ?? 0,
            reg_year: item.reg_year,
            reg_month: item.reg_month,
          },
          { isSynced: 1, isDeleted: deleted ? 1 : 0, createdAt, updatedAt },
        );
      },
    },
    apiRes,
  );
}

export async function moveTempToRealChildDeathRegistrationTable() {
  const db = await getDb();
  const staged = await db.getAllAsync<ChildDeathRegistrationStoreType>(
    `SELECT * FROM child_death_registration_staging`,
  );
  if (!staged.length) return;

  const placeholders = COLUMNS.map(() => "?").join(", ");
  const updateSet = COLUMNS.filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `INSERT INTO child_death_registration (${COLUMNS.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET
         ${updateSet}
       WHERE datetime(excluded.updated_at) > datetime(child_death_registration.updated_at)
          OR child_death_registration.updated_at IS NULL;`,
      getValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }
  await setSyncTimestamp("child_death_registration", new Date().toISOString());
}
