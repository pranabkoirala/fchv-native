import * as Crypto from "expo-crypto";
import {
  getCurrentNepaliDate,
  resolveNepaliYearMonth,
} from "../../../utils/dateHelper";
import { getDb } from "../db";
import {
  CreatePregnancyPayload,
  PregnancyStoreType,
} from "../types/pregnancyModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export async function createPregnancy(
  payload: Omit<CreatePregnancyPayload, "id" | "created_at" | "updated_at"> & {
    id?: string;
  },
): Promise<PregnancyStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  // If this new pregnancy is marked as current, deactivate other current pregnancies for this mother
  if (payload.is_current) {
    await db.runAsync(
      `UPDATE pregnancy SET is_current = 0, updated_at = ? WHERE mother = ? AND id != ? AND is_current = 1`,
      [now, payload.mother, id]
    );
  }

  await db.runAsync(
    `INSERT INTO pregnancy 
      (id, mother, lmp_date, expected_delivery_date, caretakers_name, caretakers_phone, is_current, gravida, parity, selected, ended, delivered, risk_level, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mother = excluded.mother,
      lmp_date = excluded.lmp_date,
      expected_delivery_date = excluded.expected_delivery_date,
      caretakers_name = excluded.caretakers_name,
      caretakers_phone = excluded.caretakers_phone,
      is_current = excluded.is_current,
      gravida = excluded.gravida,
      parity = excluded.parity,
      selected = excluded.selected,
      ended = excluded.ended,
      delivered = excluded.delivered,
      risk_level = excluded.risk_level,
      is_synced = excluded.is_synced,
      is_deleted = excluded.is_deleted,
      updated_at = excluded.updated_at;`,
    [
      id,
      payload.mother,
      payload.lmp_date,
      payload.expected_delivery_date ?? null,
      payload.caretakers_name ?? null,
      payload.caretakers_phone ?? null,
      payload.is_current ? 1 : 0,
      payload.gravida ?? null,
      payload.parity ?? null,
      payload.selected ? 1 : 0,
      payload.ended ? 1 : 0,
      payload.delivered ? 1 : 0,
      payload.risk_level || "normal",
      0,
      0,
      getCurrentNepaliDate().year,
      getCurrentNepaliDate().month,
      now,
      now,
    ],
  );

  return {
    id: id,
    mother: payload.mother,
    lmp_date: payload.lmp_date,
    expected_delivery_date: payload.expected_delivery_date ?? null,
    caretakers_name: payload.caretakers_name ?? null,
    caretakers_phone: payload.caretakers_phone ?? null,
    is_current: payload.is_current ? 1 : 0,
    gravida: payload.gravida ?? null,
    parity: payload.parity ?? null,
    selected: payload.selected ? 1 : 0,
    ended: payload.ended ? 1 : 0,
    delivered: payload.delivered ? 1 : 0,
    risk_level: payload.risk_level || "normal",
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    reg_year: getCurrentNepaliDate().year,
    reg_month: getCurrentNepaliDate().month,
    created_at: now,
    updated_at: now,
  };
}

export async function unSyncedPregnancies(): Promise<CreatePregnancyPayload[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT 
      p.*,
      (m.first_name || ' ' || m.last_name) as mother_name
     FROM pregnancy p
     LEFT JOIN mother m ON p.mother = m.id
     WHERE p.is_synced = 0 AND p.is_deleted = 0`,
  );

  return rows.map((row) => ({
    id: row.id,
    mother: row.mother || "",
    name: row.mother_name || "Unknown",
    gravida: row.gravida ?? undefined,
    parity: row.parity ?? undefined,
    lmp_date: row.lmp_date,
    expected_delivery_date: row.expected_delivery_date ?? undefined,
    caretakers_name: row.caretakers_name || undefined,
    caretakers_phone: row.caretakers_phone || undefined,
    is_current: row.is_current === 1,
    selected: row.selected === 1,
    ended: row.ended === 1,
    delivered: row.delivered === 1,
    risk_level: (row.risk_level as any) || "normal",
    is_synced: false,
  }));
}

export async function getPregnancyByMotherId(
  motherId: string,
): Promise<PregnancyStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<PregnancyStoreType>(
    `SELECT * FROM pregnancy 
     WHERE mother = ? AND is_deleted = 0 
     ORDER BY created_at DESC LIMIT 1`,
    [motherId],
  );
}

export async function getPregnanciesByMotherId(
  motherId: string,
): Promise<PregnancyStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<PregnancyStoreType>(
    `SELECT * FROM pregnancy 
     WHERE mother = ? AND is_deleted = 0 
     ORDER BY created_at DESC`,
    [motherId],
  );
}

export async function deletePregnancy(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE pregnancy SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export async function insertToTempPregnancyTable(apiRes: any[]) {
  if (!apiRes.length) return;
  const db = await getDb();

  const columns = [
    "id",
    "mother",
    "gravida",
    "parity",
    "lmp_date",
    "expected_delivery_date",
    "caretakers_name",
    "caretakers_phone",
    "is_current",
    "selected",
    "ended",
    "delivered",
    "risk_level",
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
      table: "pregnancy_staging",
      columns,
      onConflict: "replace",
      rows: (item: any) => [
        item.id,
        item.mother ?? null,
        item.gravida ?? null,
        item.parity ?? null,
        item.lmp_date,
        item.expected_delivery_date ?? null,
        item.caretakers_name ?? null,
        item.caretakers_phone ?? null,
        item.is_current ? 1 : 0,
        item.selected ? 1 : 0,
        item.ended ? 1 : 0,
        item.delivered ? 1 : 0,
        item.risk_level ?? "normal",
        item.reg_year ?? null,
        item.reg_month ?? null,
        1,
        item.deleted ? 1 : 0,
        item.created_at,
        item.updated_at,
      ],
    },
    apiRes,
  );
}

export async function moveTempToRealPregnancyTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<any>(`SELECT * FROM pregnancy_staging`);

  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO pregnancy
        (id, mother, gravida, parity, lmp_date, expected_delivery_date, caretakers_name, caretakers_phone, is_current, selected, ended, delivered, risk_level, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mother = excluded.mother,
        gravida = excluded.gravida,
        parity = excluded.parity,
        lmp_date = excluded.lmp_date,
        expected_delivery_date = excluded.expected_delivery_date,
        caretakers_name = excluded.caretakers_name,
        caretakers_phone = excluded.caretakers_phone,
        is_current = excluded.is_current,
        selected = excluded.selected,
        ended = excluded.ended,
        delivered = excluded.delivered,
        risk_level = excluded.risk_level,
        reg_year = excluded.reg_year,
        reg_month = excluded.reg_month,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted
      WHERE datetime(excluded.updated_at) > datetime(pregnancy.updated_at)
         OR pregnancy.updated_at IS NULL;
      `,
      [
        item.id,
        item.mother,
        item.gravida,
        item.parity,
        item.lmp_date,
        item.expected_delivery_date,
        item.caretakers_name,
        item.caretakers_phone,
        item.is_current,
        item.selected,
        item.ended,
        item.delivered,
        item.risk_level,
        item.reg_year,
        item.reg_month,
        1,
        item.is_deleted,
        item.created_at,
        item.updated_at,
      ],
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("pregnancy", now);
}

export async function getSelectedPregnancy(): Promise<PregnancyStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<PregnancyStoreType>(
    `SELECT * FROM pregnancy WHERE selected = 1 AND is_deleted = 0`,
  );
}

export async function getPregnancyCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pregnancy WHERE is_deleted = 0 AND is_current = 1",
  );
  return result?.count ?? 0;
}

export interface PregnantWomenListItem {
  id: string;
  mother: string;
  name: string;
  husband_name: string;
  age: number;
  ward: string;
  phone: string;
  lmp_date: string;
  edd: string;
  gravida: number;
  parity: number;
  risk_level: string;
  reg_month?: string;
  created_at?: string;
}

export async function getPregnantWomenList(): Promise<PregnantWomenListItem[]> {
  const db = await getDb();
  const query = `
    SELECT 
      p.id,
      p.mother,
      (m.first_name || ' ' || m.last_name) as name,
      m.husband_name,
      m.phone_number as phone,
      p.lmp_date,
      p.expected_delivery_date as edd,
      p.gravida,
      p.parity,
      p.risk_level,
      p.reg_month,
      p.created_at
    FROM pregnancy p
    INNER JOIN mother m ON p.mother = m.id
    WHERE p.is_deleted = 0 AND p.is_current = 1 AND m.is_deleted = 0
    ORDER BY p.updated_at DESC
  `;
  const rows = await db.getAllAsync<any>(query);
  return rows.map((row) => ({
    ...row,
    gravida: row.gravida || 0,
    parity: row.parity || 0,
  }));
}

export async function getPregnancyById(id: string): Promise<any> {
  const db = await getDb();
  const query = `
    SELECT 
      p.*,
      (m.first_name || ' ' || m.last_name) as mother_name,
      m.phone_number as mother_phone
    FROM pregnancy p
    INNER JOIN mother m ON p.mother = m.id
    WHERE p.id = ? AND p.is_deleted = 0
  `;
  return await db.getFirstAsync<any>(query, [id]);
}

export async function updatePregnancy(
  id: string,
  payload: Partial<
    Omit<CreatePregnancyPayload, "id" | "created_at" | "updated_at">
  >,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE pregnancy SET
      mother = COALESCE(?, mother),
      lmp_date = COALESCE(?, lmp_date),
      expected_delivery_date = COALESCE(?, expected_delivery_date),
      caretakers_name = COALESCE(?, caretakers_name),
      caretakers_phone = COALESCE(?, caretakers_phone),
      is_current = COALESCE(?, is_current),
      gravida = COALESCE(?, gravida),
      parity = COALESCE(?, parity),
      selected = COALESCE(?, selected),
      ended = COALESCE(?, ended),
      delivered = COALESCE(?, delivered),
      risk_level = COALESCE(?, risk_level),
      is_synced = 0,
      updated_at = ?
    WHERE id = ?`,
    [
      payload.mother ?? null,
      payload.lmp_date ?? null,
      payload.expected_delivery_date ?? null,
      payload.caretakers_name ?? null,
      payload.caretakers_phone ?? null,
      payload.is_current === undefined ? null : payload.is_current ? 1 : 0,
      payload.gravida ?? null,
      payload.parity ?? null,
      payload.selected === undefined ? null : payload.selected ? 1 : 0,
      payload.ended === undefined ? null : payload.ended ? 1 : 0,
      payload.delivered === undefined ? null : payload.delivered ? 1 : 0,
      payload.risk_level ?? null,
      now,
      id,
    ],
  );
}

export async function getPregnancyTrend(): Promise<
  { month: number; year: number; count: number }[]
> {
  const db = await getDb();
  const query = `
    SELECT 
      reg_year,
      reg_month,
      created_at
    FROM pregnancy 
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
export async function deactivateOtherPregnancies(motherId: string, currentPregnancyId: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE pregnancy SET is_current = 0, updated_at = ? WHERE mother = ? AND id != ? AND is_current = 1`,
    [now, motherId, currentPregnancyId]
  );
}
