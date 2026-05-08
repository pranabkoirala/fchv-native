import { getDb } from "../db";
import { NewbornDeathStoreType } from "../types/newbornDeathModal";

import * as Crypto from "expo-crypto";

export async function createNewbornDeath(data: Partial<NewbornDeathStoreType>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const id = Crypto.randomUUID();
  
  await db.runAsync(
    `INSERT INTO hmis_newborn_death (
      id, mother_id, mother_name, baby_name, birth_day, birth_month, birth_year,
      birth_condition, birth_condition_other,
      death_age_days, death_age_unit, cause_of_death, cause_of_death_other, death_place, death_place_other,
      gender, remarks, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.mother_id!,
      data.mother_name!,
      data.baby_name || '',
      data.birth_day || 0,
      data.birth_month || 0,
      data.birth_year || 0,
      data.birth_condition || '',
      data.birth_condition_other || '',
      data.death_age_days || 0,
      data.death_age_unit || 'days',
      data.cause_of_death || '',
      data.cause_of_death_other || '',
      data.death_place || '',
      data.death_place_other || '',
      data.gender || '',
      data.remarks || '',
      now,
      now
    ]
  );
}

export async function getAllNewbornDeaths(): Promise<NewbornDeathStoreType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death ORDER BY created_at DESC`
  );
  return rows;
}

export async function getNewbornDeathByMother(motherId: string): Promise<NewbornDeathStoreType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NewbornDeathStoreType>(
    `SELECT * FROM hmis_newborn_death WHERE mother_id = ?`,
    [motherId]
  );
  return row;
}

export async function getTotalNewbornDeaths(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM hmis_newborn_death`
  );
  return result?.count || 0;
}

export async function deleteNewbornDeath(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM hmis_newborn_death WHERE id = ?`, [id]);
}
