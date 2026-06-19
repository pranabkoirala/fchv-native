import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  CreateMaternalDeathPayload,
  MaternalDeathStoreType,
} from "../types/maternalDeathModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

const MATERNAL_DEATH_COLUMNS = [
  "id",
  "mother",
  "serial_no",
  "mother_name",
  "mother_age",
  "death_condition",
  "death_condition_other",
  "death_day",
  "death_month",
  "death_year",
  "death_place",
  "death_place_other",
  "child_condition",
  "remarks",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

export async function createMaternalDeath(
  payload: CreateMaternalDeathPayload,
): Promise<MaternalDeathStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO hmis_maternal_death 
      (id, mother, serial_no, mother_name, mother_age, death_condition, death_condition_other,
       death_day, death_month, death_year, death_place, death_place_other, child_condition, remarks,
       reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      id,
      payload.mother ?? null,
      payload.serial_no ?? null,
      payload.mother_name ?? null,
      payload.mother_age ?? null,
      payload.death_condition ?? null,
      payload.death_condition_other ?? "",
      payload.death_day ?? null,
      payload.death_month ?? null,
      payload.death_year ?? null,
      payload.death_place ?? null,
      payload.death_place_other ?? "",
      payload.child_condition ?? null,
      payload.remarks ?? null,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    ...payload,
    id,
    reg_month: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    reg_year: currentYear,
    is_synced: 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function getAllMaternalDeaths(): Promise<
  MaternalDeathStoreType[]
> {
  const db = await getDb();
  const rows = await db.getAllAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
  return rows;
}

export async function getMaternalDeathByMother(
  motherId: string,
): Promise<MaternalDeathStoreType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death WHERE mother = ? AND is_deleted = 0`,
    [motherId],
  );
  return row;
}

export async function getTotalMaternalDeaths(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM hmis_maternal_death WHERE is_deleted = 0`,
  );
  return result?.count || 0;
}

export async function deleteMaternalDeath(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE hmis_maternal_death SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export async function unSyncedMaternalDeaths(): Promise<
  MaternalDeathStoreType[]
> {
  const db = await getDb();
  return await db.getAllAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death WHERE is_synced = 0`,
  );
}

export async function insertToTempMaternalDeathTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "hmis_maternal_death_staging",
      columns: MATERNAL_DEATH_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;
        const motherId =
          item.mother?.id ??
          (typeof item.mother === "string" ? item.mother : null) ??
          null;

        return [
          item.id,
          motherId,
          item.serial_no ?? null,
          item.mother_name ?? null,
          item.mother_age ?? null,
          item.death_condition ?? null,
          item.death_condition_other ?? null,
          item.death_day ?? null,
          item.death_month ?? null,
          item.death_year ?? null,
          item.death_place ?? null,
          item.death_place_other ?? null,
          item.child_condition ?? null,
          item.remarks ?? null,
          item.reg_year ?? null,
          item.reg_month ?? null,
          1,
          deleted ? 1 : 0,
          createdAt,
          updatedAt,
        ];
      },
    },
    apiRes,
  );
}

export async function moveTempToRealMaternalDeathTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death_staging`,
  );
  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO hmis_maternal_death
        (id, mother, serial_no, mother_name, mother_age, death_condition, death_condition_other,
         death_day, death_month, death_year, death_place, death_place_other, child_condition, remarks,
         reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mother = excluded.mother,
        serial_no = excluded.serial_no,
        mother_name = excluded.mother_name,
        mother_age = excluded.mother_age,
        death_condition = excluded.death_condition,
        death_condition_other = excluded.death_condition_other,
        death_day = excluded.death_day,
        death_month = excluded.death_month,
        death_year = excluded.death_year,
        death_place = excluded.death_place,
        death_place_other = excluded.death_place_other,
        child_condition = excluded.child_condition,
        remarks = excluded.remarks,
        reg_year = excluded.reg_year,
        reg_month = excluded.reg_month,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      WHERE datetime(excluded.updated_at) > datetime(hmis_maternal_death.updated_at)
         OR hmis_maternal_death.updated_at IS NULL;
      `,
      [
        item.id,
        item.mother ?? null,
        item.serial_no ?? null,
        item.mother_name ?? null,
        item.mother_age ?? null,
        item.death_condition ?? null,
        item.death_condition_other ?? null,
        item.death_day ?? null,
        item.death_month ?? null,
        item.death_year ?? null,
        item.death_place ?? null,
        item.death_place_other ?? null,
        item.child_condition ?? null,
        item.remarks ?? null,
        item.reg_year ?? null,
        item.reg_month ?? null,
        1,
        item.is_deleted ? 1 : 0,
        item.created_at,
        item.updated_at,
      ],
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("hmis_maternal_death", now);
}
