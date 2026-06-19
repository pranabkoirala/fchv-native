import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { NewbornDeathStoreType } from "../types/newbornDeathModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

const NEWBORN_DEATH_COLUMNS = [
  "id",
  "mother",
  "child_id",
  "mother_name",
  "baby_name",
  "birth_day",
  "birth_month",
  "birth_year",
  "death_day",
  "death_month",
  "death_year",
  "birth_condition",
  "birth_condition_other",
  "death_age_days",
  "death_age_unit",
  "cause_of_death",
  "cause_of_death_other",
  "death_place",
  "death_place_other",
  "gender",
  "remarks",
  "reg_year",
  "reg_month",
  "is_synced",
  "is_deleted",
  "created_at",
  "updated_at",
];

export async function createNewbornDeath(
  data: Partial<NewbornDeathStoreType> & { child_id?: string },
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO hmis_newborn_death (
      id, mother, child_id, mother_name, baby_name, birth_day, birth_month, birth_year,
      death_day, death_month, death_year,
      birth_condition, birth_condition_other,
      death_age_days, death_age_unit, cause_of_death, cause_of_death_other, death_place, death_place_other,
      gender, remarks, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      id,
      data.mother!,
      data.child_id || null,
      data.mother_name!,
      data.baby_name || "",
      data.birth_day || 0,
      data.birth_month || 0,
      data.birth_year || 0,
      data.death_day || null,
      data.death_month || null,
      data.death_year || null,
      data.birth_condition || "",
      data.birth_condition_other || "",
      data.death_age_days || 0,
      data.death_age_unit || "days",
      data.cause_of_death || "",
      data.cause_of_death_other || "",
      data.death_place || "",
      data.death_place_other || "",
      data.gender || "",
      data.remarks || "",
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  if (data.child_id) {
    await db.runAsync(
      `UPDATE child_monitoring
       SET status = 'dead', is_synced = 0, updated_at = ?
       WHERE id = ? AND is_deleted = 0`,
      [now, data.child_id],
    );
  }
}

export async function getAllNewbornDeaths(): Promise<NewbornDeathStoreType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
  return rows;
}

export async function getNewbornDeathByMother(
  motherId: string,
): Promise<NewbornDeathStoreType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death WHERE mother = ? AND is_deleted = 0`,
    [motherId],
  );
  return row;
}

export async function getTotalNewbornDeaths(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM hmis_newborn_death WHERE is_deleted = 0`,
  );
  return result?.count || 0;
}

export async function deleteNewbornDeath(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE hmis_newborn_death SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export async function unSyncedNewbornDeaths(): Promise<NewbornDeathStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death WHERE is_synced = 0`,
  );
}

export async function insertToTempNewbornDeathTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  await bulkInsertToTempTable<any>(
    {
      db,
      table: "hmis_newborn_death_staging",
      columns: NEWBORN_DEATH_COLUMNS,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;
        const motherId =
          item.mother?.id ??
          (typeof item.mother === "string" ? item.mother : null) ??
          null;
        const childId =
          item.child_id ??
          item.child?.id ??
          (typeof item.child === "string" ? item.child : null) ??
          null;

        return [
          item.id,
          motherId,
          childId,
          item.mother_name ?? null,
          item.baby_name ?? null,
          item.birth_day ?? null,
          item.birth_month ?? null,
          item.birth_year ?? null,
          item.death_day ?? null,
          item.death_month ?? null,
          item.death_year ?? null,
          item.birth_condition ?? null,
          item.birth_condition_other ?? null,
          item.death_age_days ?? null,
          item.death_age_unit ?? "days",
          item.cause_of_death ?? null,
          item.cause_of_death_other ?? null,
          item.death_place ?? null,
          item.death_place_other ?? null,
          item.gender ?? null,
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

export async function moveTempToRealNewbornDeathTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death_staging`,
  );
  if (!staged.length) return;

  const placeholders = NEWBORN_DEATH_COLUMNS.map(() => "?").join(", ");
  const updateSet = NEWBORN_DEATH_COLUMNS
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO hmis_newborn_death (${NEWBORN_DEATH_COLUMNS.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateSet}
      WHERE datetime(excluded.updated_at) > datetime(hmis_newborn_death.updated_at)
         OR hmis_newborn_death.updated_at IS NULL;
      `,
      NEWBORN_DEATH_COLUMNS.map((column) => item[column as keyof NewbornDeathStoreType] ?? null),
    );

    if (item.child_id && !item.is_deleted) {
      await db.runAsync(
        `UPDATE child_monitoring
         SET status = 'dead', is_synced = 1, updated_at = ?
         WHERE id = ? AND is_deleted = 0`,
        [item.updated_at ?? new Date().toISOString(), item.child_id],
      );
    }
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("hmis_newborn_death", now);
}
