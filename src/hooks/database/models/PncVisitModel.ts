import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { CreatePncVisitPayload, PncVisitStoreType } from "../types/pncVisitModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export async function createPncVisit(
  payload: Omit<CreatePncVisitPayload, "created_at" | "updated_at">,
): Promise<PncVisitStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  await db.runAsync(
    `INSERT OR REPLACE INTO pnc_visit 
      (id, mother, name, visit_date, visit_type, visit_place, visit_number, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      payload.mother,
      payload.name ?? null,
      payload.visit_date,
      payload.visit_type ?? "PNC",
      payload.visit_place ?? null,
      payload.visit_number ?? 1,
      payload.is_synced ? 1 : 0,
      0,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    id,
    mother: payload.mother,
    name: payload.name ?? null,
    visit_date: payload.visit_date,
    visit_type: payload.visit_type ?? "PNC",
    visit_place: payload.visit_place ?? null,
    visit_number: payload.visit_number ?? 1,
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    created_at: now,
    updated_at: now,
  };
}

export async function updatePncVisit(
  id: string,
  payload: Partial<
    Omit<CreatePncVisitPayload, "id" | "created_at" | "updated_at">
  >,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const sets: string[] = ["updated_at = ?", "is_synced = ?"];
  const values: any[] = [now, 0];

  if (payload.name !== undefined) {
    sets.push("name = ?");
    values.push(payload.name);
  }
  if (payload.visit_date !== undefined) {
    sets.push("visit_date = ?");
    values.push(payload.visit_date);
  }
  if (payload.visit_place !== undefined) {
    sets.push("visit_place = ?");
    values.push(payload.visit_place);
  }
  if (payload.visit_number !== undefined) {
    sets.push("visit_number = ?");
    values.push(payload.visit_number);
  }
  if (payload.is_synced !== undefined) {
    values[1] = payload.is_synced ? 1 : 0;
  }

  values.push(id);
  await db.runAsync(`UPDATE pnc_visit SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deletePncVisit(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE pnc_visit SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export async function getPncVisitById(id: string): Promise<PncVisitStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<PncVisitStoreType>(
    `SELECT * FROM pnc_visit WHERE id = ? AND is_deleted = 0`,
    [id],
  );
}

export interface PncVisitListItem {
  id: string;
  mother: string;
  name: string;
  address: string;
  visit_date: string;
  visit_place: string;
}

export async function getAllPncVisits(): Promise<PncVisitListItem[]> {
  const db = await getDb();
  const query = `
    SELECT 
      v.id,
      v.mother,
      COALESCE(v.name, TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, ''))) as name,
      TRIM(COALESCE(m.address_locality, '') || ' ' || COALESCE(m.address_ward, '')) as address,
      v.visit_date,
      v.visit_place
    FROM pnc_visit v
    LEFT JOIN mother m ON v.mother = m.id
    WHERE v.is_deleted = 0
    ORDER BY v.visit_date DESC, v.created_at DESC
  `;
  const rows = await db.getAllAsync<any>(query);
  return rows.map((row) => ({
    id: row.id,
    mother: row.mother,
    name: row.name || "Unknown",
    address: row.address || "",
    visit_date: row.visit_date,
    visit_place: row.visit_place || "",
  }));
}

export async function getPncVisitCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pnc_visit WHERE is_deleted = 0",
  );
  return result?.count ?? 0;
}

export async function unSyncedPncVisits(): Promise<PncVisitStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<PncVisitStoreType>(
    `SELECT * FROM pnc_visit WHERE is_synced = 0`,
  );
}

export async function getPncVisitsByMotherId(
  motherId: string,
): Promise<PncVisitStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<PncVisitStoreType>(
    `SELECT * FROM pnc_visit WHERE mother = ? AND is_deleted = 0 ORDER BY visit_date ASC`,
    [motherId],
  );
}

export async function getMaxPncVisitNumberByMother(motherId: string): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ max: number | null }>(
    `SELECT MAX(visit_number) as max FROM pnc_visit WHERE mother = ? AND is_deleted = 0`,
    [motherId],
  );
  return result?.max ?? 0;
}

export async function insertToTempPncVisitTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  const columns = [
    "id",
    "mother",
    "name",
    "visit_date",
    "visit_type",
    "visit_place",
    "visit_number",
    "reg_year",
    "reg_month",
    "is_synced",
    "is_deleted",
    "created_at",
    "updated_at",
  ];

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "pnc_visit_staging",
      columns,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return [
          item.id,
          item.mother ?? null,
          item.name ?? null,
          item.visit_date,
          item.visit_type ?? "PNC",
          item.visit_place ?? item.visit_notes ?? null,
          item.visit_number ?? 1,
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

export async function moveTempToRealPncVisitTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<PncVisitStoreType>(`SELECT * FROM pnc_visit_staging`);
  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO pnc_visit
        (id, mother, name, visit_date, visit_type, visit_place, visit_number, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mother = excluded.mother,
        name = excluded.name,
        visit_date = excluded.visit_date,
        visit_type = excluded.visit_type,
        visit_place = excluded.visit_place,
        visit_number = excluded.visit_number,
        reg_year = excluded.reg_year,
        reg_month = excluded.reg_month,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      WHERE datetime(excluded.updated_at) > datetime(pnc_visit.updated_at)
         OR pnc_visit.updated_at IS NULL;
      `,
      [
        item.id,
        item.mother,
        item.name,
        item.visit_date,
        item.visit_type ?? "PNC",
        item.visit_place ?? null,
        item.visit_number ?? 1,
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
  await setSyncTimestamp("pnc_visit", now);
}
