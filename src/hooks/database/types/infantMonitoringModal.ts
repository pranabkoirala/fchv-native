export interface InfantMonitoringStoreType {
  id: string;
  mother?: string;
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
  is_all_given: number;
  gender?: 'Male' | 'Female';
  remarks?: string;
  reg_year?: number;
  reg_month?: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  // Pregnancy linkage
  pregnancy_id?: string | null;
  registration_source?: 'PREGNANCY' | 'DIRECT_CHILD_REGISTRATION';
}

export type CreateInfantMonitoringPayload = Omit<
  InfantMonitoringStoreType,
  'is_synced' | 'is_deleted' | 'created_at' | 'updated_at'
>;
