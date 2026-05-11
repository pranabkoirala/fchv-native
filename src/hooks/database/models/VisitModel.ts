import { getDb } from '../db';
import * as Crypto from 'expo-crypto';
import { CreateVisitPayload, VisitStoreType } from '../types/visitModal';

export async function createVisit(
  payload: Omit<CreateVisitPayload, 'created_at' | 'updated_at'>
): Promise<VisitStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = payload.id || Crypto.randomUUID();

  await db.runAsync(
    `INSERT OR REPLACE INTO visit 
      (id, mother_id, name, address, visit_date, visit_type, visit_notes, is_synced, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      payload.mother_id,
      payload.name ?? null,
      payload.address ?? null,
      payload.visit_date,
      payload.visit_type,
      payload.visit_notes ?? null,
      payload.is_synced ? 1 : 0,
      0,
      now,
      now
    ]
  );

  return {
    id,
    mother_id: payload.mother_id,
    name: payload.name ?? null,
    address: payload.address ?? null,
    visit_date: payload.visit_date,
    visit_type: payload.visit_type,
    visit_notes: payload.visit_notes ?? null,
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now
  };
}

export async function updateVisit(
  id: string,
  payload: Partial<Omit<CreateVisitPayload, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (payload.name !== undefined) {
    sets.push('name = ?');
    values.push(payload.name);
  }
  if (payload.address !== undefined) {
    sets.push('address = ?');
    values.push(payload.address);
  }
  if (payload.visit_date !== undefined) {
    sets.push('visit_date = ?');
    values.push(payload.visit_date);
  }
  if (payload.visit_type !== undefined) {
    sets.push('visit_type = ?');
    values.push(payload.visit_type);
  }
  if (payload.visit_notes !== undefined) {
    sets.push('visit_notes = ?');
    values.push(payload.visit_notes);
  }
  if (payload.is_synced !== undefined) {
    sets.push('is_synced = ?');
    values.push(payload.is_synced ? 1 : 0);
  }

  values.push(id);
  await db.runAsync(`UPDATE visit SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteVisit(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE visit SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id]
  );
}

export async function getVisitById(id: string): Promise<VisitStoreType | null> {
  const db = await getDb();
  return await db.getFirstAsync<VisitStoreType>(
    `SELECT * FROM visit WHERE id = ? AND is_deleted = 0`,
    [id]
  );
}

export interface VisitListItem {
  id: string;
  mother_id: string;
  name: string;
  address: string;
  visit_date: string;
  visit_type: string;
  visit_notes: string;
}

export async function getAllVisits(): Promise<VisitListItem[]> {
  const db = await getDb();
  const query = `
    SELECT 
      v.id,
      v.mother_id,
      COALESCE(v.name, m.name) as name,
      COALESCE(v.address, m.address) as address,
      v.visit_date,
      v.visit_type,
      v.visit_notes
    FROM visit v
    LEFT JOIN mother m ON v.mother_id = m.id
    WHERE v.is_deleted = 0
    ORDER BY v.visit_date DESC, v.created_at DESC
  `;
  const rows = await db.getAllAsync<any>(query);
  return rows.map(row => ({
    id: row.id,
    mother_id: row.mother_id,
    name: row.name || 'Unknown',
    address: row.address || '',
    visit_date: row.visit_date,
    visit_type: row.visit_type,
    visit_notes: row.visit_notes || '',
  }));
}

export async function getVisitCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM visit WHERE is_deleted = 0'
  );
  return result?.count ?? 0;
}

export async function unSyncedVisits(): Promise<CreateVisitPayload[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<VisitStoreType>(
    `SELECT * FROM visit WHERE is_synced = 0 AND is_deleted = 0`
  );

  return rows.map((row) => ({
    id: row.id,
    mother_id: row.mother_id,
    name: row.name ?? undefined,
    address: row.address ?? undefined,
    visit_date: row.visit_date,
    visit_type: row.visit_type,
    visit_notes: row.visit_notes ?? undefined,
    is_synced: false,
  }));
}

export async function getVisitsByMotherId(motherId: string): Promise<VisitStoreType[]> {
  const db = await getDb();
  return await db.getAllAsync<VisitStoreType>(
    `SELECT * FROM visit WHERE mother_id = ? AND is_deleted = 0 ORDER BY visit_date ASC`,
    [motherId]
  );
}
