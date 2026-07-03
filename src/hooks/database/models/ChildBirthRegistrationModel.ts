import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";
import { ChildBirthRegistrationStoreType } from "../types/childBirthRegistration";

export async function getChildBirthRegistration(
  child: string,
): Promise<ChildBirthRegistrationStoreType | null> {
  const db = await getDb();
  return db.getFirstAsync<ChildBirthRegistrationStoreType>(
    `SELECT * FROM child_birth_registration WHERE child = ? AND is_deleted = 0`,
    [child],
  );
}

export async function saveChildBirthRegistration(payload: {
  id?: string;
  child: string;
  birth_status: number;
  reg_year?: number;
  reg_month?: number;
}): Promise<ChildBirthRegistrationStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();
  const regYear = payload.reg_year || currentYear;
  const regMonth = payload.reg_month || currentMonth;

  const existing = payload.id
    ? await db.getFirstAsync<ChildBirthRegistrationStoreType>(
        `SELECT * FROM child_birth_registration WHERE id = ? AND is_deleted = 0`,
        [payload.id],
      )
    : await getChildBirthRegistration(payload.child);

  if (existing) {
    await db.runAsync(
      `UPDATE child_birth_registration
       SET birth_status = ?, updated_at = ?, is_synced = 0
       WHERE id = ?`,
      [payload.birth_status, now, existing.id],
    );
    return {
      ...existing,
      birth_status: payload.birth_status,
      updated_at: now,
      is_synced: 0,
    };
  }

  const id = payload.id || Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO child_birth_registration
     (id, child, birth_status, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [id, payload.child, payload.birth_status, regYear, regMonth, now, now],
  );

  return {
    id,
    child: payload.child,
    birth_status: payload.birth_status,
    reg_year: regYear,
    reg_month: regMonth,
    created_at: now,
    updated_at: now,
    is_synced: 0,
    is_deleted: 0,
  };
}

export async function deleteChildBirthRegistration(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE child_birth_registration SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

const COLUMNS = [
  "id",
  "child",
  "birth_status",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getValues = (
  item: Partial<ChildBirthRegistrationStoreType>,
  opts: { isSynced: number; isDeleted: number; createdAt: string; updatedAt: string },
) => [
  item.id ?? null,
  item.child ?? null,
  item.birth_status ?? 0,
  item.reg_year ?? null,
  item.reg_month ?? null,
  opts.isSynced,
  opts.isDeleted,
  opts.createdAt,
  opts.updatedAt,
];

export async function unSyncedChildBirthRegistrations(): Promise<ChildBirthRegistrationStoreType[]> {
  const db = await getDb();
  return db.getAllAsync<ChildBirthRegistrationStoreType>(
    `SELECT * FROM child_birth_registration WHERE is_synced = 0`,
  );
}

export async function insertToTempChildBirthRegistrationTable(apiRes: any[]) {
  if (!apiRes.length) return;
  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "child_birth_registration_staging",
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
            birth_status: item.birth_status ?? 0,
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

export async function moveTempToRealChildBirthRegistrationTable() {
  const db = await getDb();
  const staged = await db.getAllAsync<ChildBirthRegistrationStoreType>(
    `SELECT * FROM child_birth_registration_staging`,
  );
  if (!staged.length) return;

  const placeholders = COLUMNS.map(() => "?").join(", ");
  const updateSet = COLUMNS.filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `INSERT INTO child_birth_registration (${COLUMNS.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET
         ${updateSet}
       WHERE datetime(excluded.updated_at) > datetime(child_birth_registration.updated_at)
          OR child_birth_registration.updated_at IS NULL;`,
      getValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }
  await setSyncTimestamp("child_birth_registration", new Date().toISOString());
}
