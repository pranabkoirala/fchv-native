import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  CreateMaternalDeathPayload,
  MaternalDeathStoreType,
} from "../types/maternalDeathModal";

export async function createMaternalDeath(
  payload: CreateMaternalDeathPayload,
): Promise<MaternalDeathStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO hmis_maternal_death 
      (id, mother_id, serial_no, mother_name, mother_age, death_condition, death_condition_other,
       death_day, death_month, death_year, death_place, death_place_other, child_condition, remarks, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.mother_id ?? null,
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
    created_at: now,
    updated_at: now,
  };
}

export async function getAllMaternalDeaths(): Promise<
  MaternalDeathStoreType[]
> {
  const db = await getDb();
  const rows = await db.getAllAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death ORDER BY created_at DESC`,
  );
  return rows;
}

export async function getMaternalDeathByMother(
  motherId: string,
): Promise<MaternalDeathStoreType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MaternalDeathStoreType>(
    `SELECT * FROM hmis_maternal_death WHERE mother_id = ?`,
    [motherId],
  );
  return row;
}

export async function getTotalMaternalDeaths(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM hmis_maternal_death`,
  );
  return result?.count || 0;
}

export async function deleteMaternalDeath(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM hmis_maternal_death WHERE id = ?`, [id]);
}
