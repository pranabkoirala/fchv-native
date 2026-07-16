import {
  getCurrentNepaliDate,
  resolveNepaliYearMonth,
} from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  CreateInfantMonitoringPayload,
  InfantMonitoringStoreType,
} from "../types/infantMonitoringModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

const CHILD_MONITORING_COLUMNS = [
  "id",
  "mother",
  "baby_name",
  "date_of_birth",
  "birth_place",
  "status",
  "fchv_present",
  "skilled_birth_attended",
  "baby_weight",
  "umbilical_ointment",
  "skin_to_skin",
  "early_breastfeeding",
  "asphyxiated_newborn",
  "is_all_given",
  "gender",
  "remarks",
  "pregnancy_id",
  "registration_source",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

export async function createInfantMonitoring(
  payload: CreateInfantMonitoringPayload,
): Promise<InfantMonitoringStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  await db.runAsync(
    `INSERT INTO child_monitoring 
      (id, mother, baby_name, date_of_birth, birth_place, status, fchv_present, skilled_birth_attended,
       baby_weight, umbilical_ointment, skin_to_skin, early_breastfeeding, asphyxiated_newborn, is_all_given,
       gender, remarks, pregnancy_id, registration_source, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mother = excluded.mother,
      baby_name = excluded.baby_name,
      date_of_birth = excluded.date_of_birth,
      birth_place = excluded.birth_place,
      status = excluded.status,
      fchv_present = excluded.fchv_present,
      skilled_birth_attended = excluded.skilled_birth_attended,
      baby_weight = excluded.baby_weight,
      umbilical_ointment = excluded.umbilical_ointment,
      skin_to_skin = excluded.skin_to_skin,
      early_breastfeeding = excluded.early_breastfeeding,
      asphyxiated_newborn = excluded.asphyxiated_newborn,
      is_all_given = excluded.is_all_given,
      gender = excluded.gender,
      remarks = excluded.remarks,
      pregnancy_id = excluded.pregnancy_id,
      registration_source = excluded.registration_source,
      reg_year = excluded.reg_year,
      reg_month = excluded.reg_month,
      is_synced = excluded.is_synced,
      is_deleted = excluded.is_deleted,
      updated_at = excluded.updated_at;`,
    [
      payload.id,
      payload.mother ?? null,
      payload.baby_name ?? null,
      payload.date_of_birth ?? null,
      payload.birth_place ?? null,
      payload.status ?? "alive",
      payload.fchv_present ?? 0,
      payload.skilled_birth_attended ?? 0,
      payload.baby_weight ?? null,
      payload.umbilical_ointment ?? 0,
      payload.skin_to_skin ?? 0,
      payload.early_breastfeeding ?? 0,
      payload.asphyxiated_newborn ?? 0,
      payload.is_all_given ?? 0,
      payload.gender ?? null,
      payload.remarks ?? null,
      payload.pregnancy_id ?? null,
      payload.registration_source ?? 'DIRECT_CHILD_REGISTRATION',
      0, // is_synced
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

export async function getAllInfantMonitorings(): Promise<
  InfantMonitoringStoreType[]
> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT cm.*, 
            (m.first_name || ' ' || m.last_name) as mother_name 
     FROM child_monitoring cm
     LEFT JOIN mother m ON cm.mother = m.id
     WHERE cm.is_deleted = 0 
     ORDER BY cm.created_at DESC`,
  );
  return rows;
}

export async function unSyncedChildMonitorings(): Promise<
  InfantMonitoringStoreType[]
> {
  const db = await getDb();
  return await db.getAllAsync<InfantMonitoringStoreType>(
    `SELECT * FROM child_monitoring WHERE is_synced = 0 AND is_deleted = 0`,
  );
}

export async function insertToTempChildMonitoringTable(apiRes: any[]) {
  if (!apiRes.length) return;
  const db = await getDb();

  // Capture existing local statuses so a locally-marked "dead" child is never
  // reverted back to "alive" by an incoming sync payload that omits status.
  const existingRows = await db.getAllAsync<{ id: string; status: string }>(
    `SELECT id, status FROM child_monitoring WHERE is_deleted = 0`,
  );
  const existingStatusById = new Map<string, string>(
    existingRows.map((r) => [r.id, r.status]),
  );

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "child_monitoring_staging",
      columns: CHILD_MONITORING_COLUMNS,
      onConflict: "replace",
      rows: (item: any) => {
        const existing = existingStatusById.get(item.id);
        const incoming = item.status;
        const status =
          existing?.toLowerCase() === "dead" ||
          incoming?.toLowerCase() === "dead"
            ? "dead"
            : incoming ?? "alive";
        return [
          item.id,
          item.mother ?? null,
          item.baby_name ?? null,
          item.date_of_birth ?? null,
          item.birth_place ?? null,
          status,
          item.fchv_present ?? 0,
          item.skilled_birth_attended ?? 0,
          item.baby_weight ?? null,
          item.umbilical_ointment ?? 0,
          item.skin_to_skin ?? 0,
          item.early_breastfeeding ?? 0,
          item.asphyxiated_newborn ?? 0,
          item.is_all_given ?? 0,
          item.gender ?? null,
          item.remarks ?? null,
          item.pregnancy ?? item.pregnancy_id ?? null,
          item.registration_source ?? "DIRECT_CHILD_REGISTRATION",
          item.reg_year ?? null,
          item.reg_month ?? null,
          1,
          item.deleted || item.is_deleted ? 1 : 0,
          item.created_at ?? new Date().toISOString(),
          item.updated_at ?? new Date().toISOString(),
        ];
      },
    },
    apiRes,
  );
}

export async function moveTempToRealChildMonitoringTable() {
  const db = await getDb();
  const staged = await db.getAllAsync<any>(
    `SELECT * FROM child_monitoring_staging`,
  );

  if (!staged.length) return;

  const placeholders = CHILD_MONITORING_COLUMNS.map(() => "?").join(", ");
  const updateSet = CHILD_MONITORING_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO child_monitoring (${CHILD_MONITORING_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(child_monitoring.updated_at)
         OR child_monitoring.updated_at IS NULL;
      `,
      CHILD_MONITORING_COLUMNS.map((column) => item[column]),
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("child_monitoring", now);
}

export async function deleteInfantMonitoring(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE child_monitoring SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), id],
  );
}

export async function getInfantMonitoringById(
  id: string,
): Promise<InfantMonitoringStoreType | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<InfantMonitoringStoreType>(
    `SELECT cm.*, 
            (m.first_name || ' ' || m.last_name) as mother_name 
     FROM child_monitoring cm
     LEFT JOIN mother m ON cm.mother = m.id
     WHERE cm.id = ? AND cm.is_deleted = 0`,
    [id],
  );
  return result || null;
}

export async function getInfantMonitoringByMother(
  motherId: string,
): Promise<InfantMonitoringStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<InfantMonitoringStoreType>(
    `SELECT * FROM child_monitoring WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [motherId],
  );
}

export async function getInfantMonitoringsByMother(
  motherId: string,
): Promise<InfantMonitoringStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<InfantMonitoringStoreType>(
    `SELECT * FROM child_monitoring WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [motherId],
  );
}

export async function getChildrenByPregnancy(
  pregnancyId: string,
): Promise<InfantMonitoringStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<InfantMonitoringStoreType>(
    `SELECT * FROM child_monitoring WHERE pregnancy_id = ? AND is_deleted = 0 ORDER BY created_at DESC`,
    [pregnancyId],
  );
}

export async function getChildTrend(): Promise<
  { month: number; year: number; count: number }[]
> {
  const db = await getDb();
  const query = `
    SELECT 
      reg_year,
      reg_month,
      created_at
    FROM child_monitoring 
    WHERE is_deleted = 0
  `;
  const rows = await db.getAllAsync<any>(query);
  const counts = new Map<string, { month: number; year: number; count: number }>();

  rows.forEach((row: any) => {
    const resolved = resolveNepaliYearMonth(
      row.reg_year,
      row.reg_month,
      row.created_at,
    );
    if (!resolved) return;

    const key = `${resolved.year}-${resolved.month}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        month: resolved.month - 1,
        year: resolved.year,
        count: 1,
      });
    }
  });

  return Array.from(counts.values());
}

export async function updateAllVaccinatedStatus(
  id: string,
  completed: boolean,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE child_monitoring SET is_all_given = ?, updated_at = ? WHERE id = ?`,
    [completed ? 1 : 0, new Date().toISOString(), id],
  );
}
