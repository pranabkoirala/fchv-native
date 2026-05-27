import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  AdolescentIfaStoreType,
  CreateAdolescentIfaPayload,
} from "../types/adolescentIfaModal";

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

export async function createAdolescentIfa(
  payload: CreateAdolescentIfaPayload,
): Promise<AdolescentIfaStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const cols = [
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
  const placeholders = cols.map(() => "?").join(", ");

  const updateSet = cols
    .filter(
      (c) =>
        c !== "id" &&
        c !== "created_at" &&
        c !== "is_synced" &&
        c !== "is_deleted",
    )
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  const values = [
    payload.id,
    payload.name,
    payload.age_group,
    ...WEEK_COLS_PHASE1.map((c) => (payload as any)[c] ?? 0),
    payload.phase1_completed ?? 0,
    ...WEEK_COLS_PHASE2.map((c) => (payload as any)[c] ?? 0),
    payload.phase2_completed ?? 0,
    payload.remarks ?? null,
    currentYear,
    currentMonth,
    0, // is_synced
    0, // is_deleted
    now,
    now,
  ];

  await db.runAsync(
    `INSERT INTO adolescent_ifa (${cols.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updateSet};`,
    values,
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
    `UPDATE adolescent_ifa SET is_deleted = 1, updated_at = ? WHERE id = ?`,
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
