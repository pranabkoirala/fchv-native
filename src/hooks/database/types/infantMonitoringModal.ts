export interface InfantMonitoringStoreType {
  id: string;
  mother_id?: string;
  mother_name?: string;
  baby_name?: string;
  date_of_birth?: string;
  birth_place?: string; // 'home', 'institution', 'trained_worker'
  status?: string; // 'alive', 'dead'
  fchv_present: number;
  skilled_birth_attended: number;
  baby_weight?: string; // 'normal', 'low', 'very_low'
  umbilical_ointment: number;
  skin_to_skin: number;
  early_breastfeeding: number;
  asphyxiated_newborn: number;
  remarks?: string;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export type CreateInfantMonitoringPayload = Omit<
  InfantMonitoringStoreType,
  'is_synced' | 'is_deleted' | 'created_at' | 'updated_at'
>;
