import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  CreateDeliveryPayload,
  DeliveryStoreType,
} from "../types/deliveryModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

// ─── Column manifest ──────────────────────────────────────────────────────────

const DELIVERY_COLUMNS = [
  "id",
  "mother",
  "delivery_date",
  "delivery_place",
  "baby_weight",
  "gender",
  "status",
  "fchv_present",
  "skilled_birth_attended",
  "asphyxiated_newborn",
  "umbilical_ointment",
  "skin_to_skin",
  "early_breastfeeding",
  "remarks",
  "pregnancy_id",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
] as const;

export async function createDelivery(
  payload: CreateDeliveryPayload,
): Promise<DeliveryStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  await db.runAsync(
    `INSERT INTO delivery
      (id, mother, delivery_date, delivery_place, baby_weight, gender, status,
       fchv_present, skilled_birth_attended, asphyxiated_newborn,
       umbilical_ointment, skin_to_skin, early_breastfeeding,
       remarks, pregnancy_id, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mother               = excluded.mother,
      delivery_date        = excluded.delivery_date,
      delivery_place       = excluded.delivery_place,
      baby_weight          = excluded.baby_weight,
      gender               = excluded.gender,
      status               = excluded.status,
      fchv_present         = excluded.fchv_present,
      skilled_birth_attended = excluded.skilled_birth_attended,
      asphyxiated_newborn  = excluded.asphyxiated_newborn,
      umbilical_ointment   = excluded.umbilical_ointment,
      skin_to_skin         = excluded.skin_to_skin,
      early_breastfeeding  = excluded.early_breastfeeding,
      remarks              = excluded.remarks,
      pregnancy_id         = excluded.pregnancy_id,
      reg_year             = excluded.reg_year,
      reg_month            = excluded.reg_month,
      is_synced            = excluded.is_synced,
      is_deleted           = excluded.is_deleted,
      updated_at           = excluded.updated_at;`,
    [
      payload.id,
      payload.mother ?? null,
      payload.delivery_date ?? null,
      payload.delivery_place ?? null,
      payload.baby_weight ?? null,
      payload.gender ?? null,
      payload.status ?? "alive",
      payload.fchv_present ?? 0,
      payload.skilled_birth_attended ?? 0,
      payload.asphyxiated_newborn ?? 0,
      payload.umbilical_ointment ?? 0,
      payload.skin_to_skin ?? 0,
      payload.early_breastfeeding ?? 0,
      payload.remarks ?? null,
      payload.pregnancy_id ?? null,
      0, // is_synced — local write, not yet pushed
      0, // is_deleted
      currentYear,
      currentMonth,
      now,
      now,
    ],
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

export async function getAllDeliveries(): Promise<DeliveryStoreType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT d.*, (m.first_name || ' ' || m.last_name) AS mother_name
     FROM delivery d
     LEFT JOIN mother m ON d.mother = m.id
     WHERE d.is_deleted = 0
     ORDER BY d.created_at DESC`,
  );
  return rows.map(normalizeRow);
}

export async function getDeliveryById(
  id: string,
): Promise<DeliveryStoreType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM delivery WHERE id = ? AND is_deleted = 0`,
    [id],
  );
  return row ? normalizeRow(row) : null;
}

export async function getDeliveriesByMother(
  motherId: string,
): Promise<DeliveryStoreType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM delivery WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [motherId],
  );
  return rows.map(normalizeRow);
}

export async function deleteDelivery(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE delivery SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

// ─── Sync pipeline ────────────────────────────────────────────────────────────

/**
 * Returns all local delivery records that haven't been pushed to the server yet
 * (is_synced = 0), including soft-deleted ones so deletions are propagated.
 */
export async function unSyncedDeliveries(): Promise<DeliveryStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<DeliveryStoreType>(
    `SELECT * FROM delivery WHERE is_synced = 0`,
  );
}

/**
 * Bulk-inserts server-returned delivery records into the staging table.
 * Called during the pull-from-server phase before committing to the real table.
 */
export async function insertToTempDeliveryTable(apiRes: any[]): Promise<void> {
  if (!apiRes.length) return;

  const db = await getDb();

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "delivery_staging",
      columns: DELIVERY_COLUMNS as unknown as string[],
      onConflict: "replace",
      rows: (item: any) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const isDeleted = item.deleted ?? item.is_deleted ?? false;

        return [
          item.id,
          item.mother ?? item.mother_id ?? null,
          item.delivery_date ?? null,
          item.delivery_place ?? null,
          item.baby_weight ?? null,
          item.gender ?? null,
          item.status ?? "alive",
          item.fchv_present ?? 0,
          item.skilled_birth_attended ?? 0,
          item.asphyxiated_newborn ?? 0,
          item.umbilical_ointment ?? 0,
          item.skin_to_skin ?? 0,
          item.early_breastfeeding ?? 0,
          item.remarks ?? null,
          item.pregnancy ?? item.pregnancy_id ?? null,
          item.reg_year ?? null,
          item.reg_month ?? null,
          1, // is_synced — came from server
          isDeleted ? 1 : 0,
          createdAt,
          updatedAt,
        ];
      },
    },
    apiRes,
  );
}

/**
 * Merges records from delivery_staging into the real delivery table.
 * Uses an optimistic conflict strategy: only overwrites if the server record
 * is strictly newer than the local one.
 */
export async function moveTempToRealDeliveryTable(): Promise<void> {
  const db = await getDb();

  const staged = await db.getAllAsync<any>(`SELECT * FROM delivery_staging`);
  if (!staged.length) return;

  const cols = DELIVERY_COLUMNS as unknown as string[];
  const placeholders = cols.map(() => "?").join(", ");
  const updateSet = cols
    .filter((col) => col !== "id")
    .map((col) => `${col} = excluded.${col}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO delivery (${cols.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(delivery.updated_at)
         OR delivery.updated_at IS NULL;
      `,
      cols.map((col) => item[col] ?? null),
    );
  }

  await setSyncTimestamp("delivery", new Date().toISOString());
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function normalizeRow(row: any): DeliveryStoreType {
  return {
    ...row,
    fchv_present: row.fchv_present ?? 0,
    skilled_birth_attended: row.skilled_birth_attended ?? 0,
    asphyxiated_newborn: row.asphyxiated_newborn ?? 0,
    umbilical_ointment: row.umbilical_ointment ?? 0,
    skin_to_skin: row.skin_to_skin ?? 0,
    early_breastfeeding: row.early_breastfeeding ?? 0,
    is_synced: row.is_synced ?? 0,
    is_deleted: row.is_deleted ?? 0,
  };
}
