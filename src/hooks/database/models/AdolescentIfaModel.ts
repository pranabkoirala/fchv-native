import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  AdolescentIfaStoreType,
  CreateAdolescentIfaPayload,
} from "../types/adolescentIfaModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

const WEEK_COLS_PHASE1 = Array.from(
  { length: 13 },
  (_, i) => `phase1_week_${i + 1}`,
);
const WEEK_COLS_PHASE2 = Array.from(
  { length: 13 },
  (_, i) => `phase2_week_${i + 1}`,
);
const ALL_WEEK_COLS = [
  ...WEEK_COLS_PHASE1,
  "phase1_completed",
  ...WEEK_COLS_PHASE2,
  "phase2_completed",
];

const ADOLESCENT_IFA_COLUMNS = [
  "id",
  "name",
  "age_group",
  ...ALL_WEEK_COLS,
  "remarks",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

const getWeekValues = (item: Partial<AdolescentIfaStoreType>) => [
  ...WEEK_COLS_PHASE1.map((column) => item[column as keyof AdolescentIfaStoreType] ?? 0),
  item.phase1_completed ?? 0,
  ...WEEK_COLS_PHASE2.map((column) => item[column as keyof AdolescentIfaStoreType] ?? 0),
  item.phase2_completed ?? 0,
];

const getAdolescentIfaValues = (
  item: Partial<AdolescentIfaStoreType>,
  options: {
    isSynced: number;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
    regYear?: number | null;
    regMonth?: number | null;
  },
): (string | number | null)[] => [
  item.id ?? null,
  item.name ?? null,
  item.age_group ?? null,
  ...getWeekValues(item),
  item.remarks ?? null,
  options.regYear ?? null,
  options.regMonth ?? null,
  options.isSynced,
  options.isDeleted,
  options.createdAt,
  options.updatedAt,
];

const getUpsertSet = (columns: string[], preserveCreatedAt = false) =>
  columns
    .filter((column) => column !== "id" && (!preserveCreatedAt || column !== "created_at"))
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

export async function createAdolescentIfa(
  payload: CreateAdolescentIfaPayload,
): Promise<AdolescentIfaStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const placeholders = ADOLESCENT_IFA_COLUMNS.map(() => "?").join(", ");
  const updateSet = getUpsertSet(ADOLESCENT_IFA_COLUMNS, true);

  await db.runAsync(
    `INSERT INTO adolescent_ifa (${ADOLESCENT_IFA_COLUMNS.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updateSet};`,
    getAdolescentIfaValues(payload, {
      isSynced: 0,
      isDeleted: 0,
      regYear: currentYear,
      regMonth: currentMonth,
      createdAt: now,
      updatedAt: now,
    }),
  );

  return {
    ...payload,
    is_synced: 0,
    is_deleted: 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    created_at: now,
    updated_at: now,
  };
}

export async function getAllAdolescentIfa(): Promise<AdolescentIfaStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<AdolescentIfaStoreType>(
    `SELECT * FROM adolescent_ifa WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
}

export async function unSyncedAdolescentIfa(): Promise<
  AdolescentIfaStoreType[]
> {
  const db = await getDb();
  return await db.getAllAsync<AdolescentIfaStoreType>(
    `SELECT * FROM adolescent_ifa WHERE is_synced = 0 AND is_deleted = 0`,
  );
}

export async function insertToTempAdolescentIfaTable(apiRes: any[]) {
  if (!apiRes.length) return;
  const db = await getDb();

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "adolescent_ifa_staging",
      columns: ADOLESCENT_IFA_COLUMNS,
      onConflict: "replace",
      rows: (item: any) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const isDeleted = item.deleted || item.is_deleted ? 1 : 0;

        return getAdolescentIfaValues(item, {
          isSynced: 1,
          isDeleted,
          regYear: item.reg_year ?? null,
          regMonth: item.reg_month ?? null,
          createdAt,
          updatedAt,
        });
      },
    },
    apiRes,
  );
}

export async function moveTempToRealAdolescentIfaTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<any>(
    `SELECT * FROM adolescent_ifa_staging`,
  );

  if (!staged.length) return;

  const placeholders = ADOLESCENT_IFA_COLUMNS.map(() => "?").join(", ");
  const updateSet = getUpsertSet(ADOLESCENT_IFA_COLUMNS);

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO adolescent_ifa (${ADOLESCENT_IFA_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(adolescent_ifa.updated_at)
         OR adolescent_ifa.updated_at IS NULL;
      `,
      getAdolescentIfaValues(item, {
        isSynced: 1,
        isDeleted: item.is_deleted ?? 0,
        regYear: item.reg_year ?? null,
        regMonth: item.reg_month ?? null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("adolescent_ifa", now);
}

export async function getAdolescentIfaById(
  id: string,
): Promise<AdolescentIfaStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<AdolescentIfaStoreType>(
    `SELECT * FROM adolescent_ifa WHERE id = ? AND is_deleted = 0`,
    [id],
  );
}

export async function deleteAdolescentIfa(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE adolescent_ifa SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), id],
  );
}

export async function getAdolescentIfaCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM adolescent_ifa WHERE is_deleted = 0`,
  );
  return row?.count ?? 0;
}
