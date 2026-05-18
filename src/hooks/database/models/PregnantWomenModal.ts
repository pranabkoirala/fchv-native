import { getDb } from '../db';
import * as Crypto from "expo-crypto";
import { bulkInsertToTempTable } from './CommonModal';
import { setSyncTimestamp } from './SyncModel';
import { CreatePregnancyPayload, PregnancyStoreType } from '../types/pregnancyModal';

export async function createPregnancy(
  payload: Omit<CreatePregnancyPayload, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<PregnancyStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO pregnancy 
      (id, mother_id, lmp_date, expected_delivery_date, caretakers_name, caretakers_phone, is_current, gravida, parity, selected, ended, delivered, risk_level, is_synced, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mother_id = excluded.mother_id,
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
      payload.mother_id,
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
      payload.risk_level || 'normal',
      0,
      0,
      now,
      now
    ]
  );

  return {
    id: id,
    mother_id: payload.mother_id,
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
    risk_level: payload.risk_level || 'normal',
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now
  };
}

export async function unSyncedPregnancies(): Promise<CreatePregnancyPayload[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT 
      p.*,
      (m.first_name || ' ' || m.last_name) as mother_name
     FROM pregnancy p
     LEFT JOIN mother m ON p.mother_id = m.id
     WHERE p.is_synced = 0 AND p.is_deleted = 0`
  );

  return rows.map((row) => ({
    id: row.id,
    mother_id: row.mother_id || "",
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
    risk_level: (row.risk_level as any) || 'normal',
    is_synced: false
  }));
}

export async function getPregnancyByMotherId(motherId: string): Promise<PregnancyStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<PregnancyStoreType>(
    `SELECT * FROM pregnancy 
     WHERE mother_id = ? AND is_deleted = 0 
     ORDER BY created_at DESC LIMIT 1`,
    [motherId]
  );
}

export async function deletePregnancy(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE pregnancy SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id]
  );
}

export async function insertToTempPregnancyTable(
  apiRes: any[]
) {
  if (!apiRes.length) return;
  const db = await getDb();

  const columns = [
    "id",
    "mother_id",
    "gravida",
    "parity",
    "lmp_date",
    "expected_delivery_date",
    "is_current",
    "selected",
    "is_synced",
    "is_deleted",
    "created_at",
    "updated_at"
  ];

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "pregnancy_staging",
      columns,
      onConflict: "replace",
      rows: (item: any) => [
        item.id,
        item.mother_id,
        item.gravida ?? null,
        item.parity ?? null,
        item.lmp_date,
        item.expected_delivery_date ?? null,
        item.is_current ? 1 : 0,
        item.selected ? 1 : 0,
        1,
        item.deleted ? 1 : 0,
        item.created_at,
        item.updated_at
      ]
    },
    apiRes
  );
}

export async function moveTempToRealPregnancyTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<any>(
    `SELECT * FROM pregnancy_staging`
  );

  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO pregnancy
        (id, mother_id, gravida, parity, lmp_date, expected_delivery_date, is_current, selected, is_synced, is_deleted, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mother_id = excluded.mother_id,
        gravida = excluded.gravida,
        parity = excluded.parity,
        lmp_date = excluded.lmp_date,
        expected_delivery_date = excluded.expected_delivery_date,
        is_current = excluded.is_current,
        selected = excluded.selected,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted
      WHERE datetime(excluded.updated_at) > datetime(pregnancy.updated_at)
         OR pregnancy.updated_at IS NULL;
      `,
      [
        item.id,
        item.mother_id,
        item.gravida,
        item.parity,
        item.lmp_date,
        item.expected_delivery_date,
        item.is_current,
        item.selected,
        1,
        item.is_deleted,
        item.created_at,
        item.updated_at
      ]
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("pregnancy", now);
}

export async function getSelectedPregnancy(): Promise<PregnancyStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<PregnancyStoreType>(
    `SELECT * FROM pregnancy WHERE selected = 1 AND is_deleted = 0`
  );
}

export async function getPregnancyCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pregnancy WHERE is_deleted = 0 AND is_current = 1"
  );
  return result?.count ?? 0;
}

export interface PregnantWomenListItem {
  id: string;
  mother_id: string;
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
  created_at?: string;
}

export async function getPregnantWomenList(): Promise<PregnantWomenListItem[]> {
  const db = await getDb();
  const query = `
    SELECT 
      p.id,
      p.mother_id,
      (m.first_name || ' ' || m.last_name) as name,
      m.husband_name,
      m.phone_number as phone,
      p.lmp_date,
      p.expected_delivery_date as edd,
      p.gravida,
      p.parity,
      p.risk_level,
      p.created_at
    FROM pregnancy p
    INNER JOIN mother m ON p.mother_id = m.id
    WHERE p.is_deleted = 0 AND p.is_current = 1 AND m.is_deleted = 0
    ORDER BY p.updated_at DESC
  `;
  const rows = await db.getAllAsync<any>(query);
  return rows.map(row => ({
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
    INNER JOIN mother m ON p.mother_id = m.id
    WHERE p.id = ? AND p.is_deleted = 0
  `;
  return await db.getFirstAsync<any>(query, [id]);
}

export async function updatePregnancy(
  id: string,
  payload: Partial<Omit<CreatePregnancyPayload, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const sets: string[] = ["updated_at = ?"];
  const values: any[] = [now];

  if (payload.lmp_date !== undefined) {
    sets.push("lmp_date = ?");
    values.push(payload.lmp_date);
  }
  if (payload.expected_delivery_date !== undefined) {
    sets.push("expected_delivery_date = ?");
    values.push(payload.expected_delivery_date);
  }
  if (payload.gravida !== undefined) {
    sets.push("gravida = ?");
    values.push(payload.gravida);
  }
  if (payload.parity !== undefined) {
    sets.push("parity = ?");
    values.push(payload.parity);
  }
  if (payload.is_current !== undefined) {
    sets.push("is_current = ?");
    values.push(payload.is_current ? 1 : 0);
  }
  if (payload.selected !== undefined) {
    sets.push("selected = ?");
    values.push(payload.selected ? 1 : 0);
  }
  if (payload.caretakers_name !== undefined) {
    sets.push("caretakers_name = ?");
    values.push(payload.caretakers_name);
  }
  if (payload.caretakers_phone !== undefined) {
    sets.push("caretakers_phone = ?");
    values.push(payload.caretakers_phone);
  }
  if (payload.is_synced !== undefined) {
    sets.push("is_synced = ?");
    values.push(payload.is_synced ? 1 : 0);
  }
  if (payload.ended !== undefined) {
    sets.push("ended = ?");
    values.push(payload.ended ? 1 : 0);
  }
  if (payload.delivered !== undefined) {
    sets.push("delivered = ?");
    values.push(payload.delivered ? 1 : 0);
  }
  if (payload.risk_level !== undefined) {
    sets.push("risk_level = ?");
    values.push(payload.risk_level);
  }

  values.push(id);
  const sql = `UPDATE pregnancy SET ${sets.join(", ")} WHERE id = ?`;
  await db.runAsync(sql, values);
}

export async function getPregnancyTrend(): Promise<{ month: number; year: number; count: number }[]> {
  const db = await getDb();
  // Using substr for more robust date extraction since strftime can be picky about formats
  const query = `
    SELECT 
      CAST(substr(COALESCE(created_at, lmp_date), 6, 2) AS INTEGER) - 1 as month,
      CAST(substr(COALESCE(created_at, lmp_date), 1, 4) AS INTEGER) as year,
      COUNT(*) as count
    FROM pregnancy 
    WHERE is_deleted = 0
      AND COALESCE(created_at, lmp_date) IS NOT NULL
      AND month >= 0 AND month <= 11
      AND year > 2000
    GROUP BY year, month
  `;
  const rows = await db.getAllAsync<any>(query);
  return rows;
}

