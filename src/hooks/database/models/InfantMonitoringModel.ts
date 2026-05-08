import { getDb } from '../db';
import { CreateInfantMonitoringPayload, InfantMonitoringStoreType } from '../types/infantMonitoringModal';

export async function createInfantMonitoring(
  payload: CreateInfantMonitoringPayload
): Promise<InfantMonitoringStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO child_monitoring 
      (id, mother_id, baby_name, date_of_birth, birth_place, status, fchv_present, skilled_birth_attended,
       baby_weight, umbilical_ointment, skin_to_skin, early_breastfeeding, asphyxiated_newborn, remarks, is_synced, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mother_id = excluded.mother_id,
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
      remarks = excluded.remarks,
      updated_at = excluded.updated_at;`,
    [
      payload.id, 
      payload.mother_id ?? null, 
      payload.baby_name ?? null,
      payload.date_of_birth ?? null,
      payload.birth_place ?? null,
      payload.status ?? 'alive',
      payload.fchv_present ?? 0,
      payload.skilled_birth_attended ?? 0,
      payload.baby_weight ?? null, 
      payload.umbilical_ointment ?? 0,
      payload.skin_to_skin ?? 0,
      payload.early_breastfeeding ?? 0,
      payload.asphyxiated_newborn ?? 0,
      payload.remarks ?? null, 
      0, // is_synced
      0, // is_deleted
      now, 
      now
    ]
  );

  return {
    ...payload,
    is_synced: 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now
  };
}

export async function getAllInfantMonitorings(): Promise<InfantMonitoringStoreType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT cm.*, 
            (m.first_name || ' ' || m.last_name) as mother_name 
     FROM child_monitoring cm
     LEFT JOIN mother m ON cm.mother_id = m.id
     WHERE cm.is_deleted = 0 
     ORDER BY cm.created_at DESC`
  );
  return rows;
}

export async function deleteInfantMonitoring(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE child_monitoring SET is_deleted = 1, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
}
