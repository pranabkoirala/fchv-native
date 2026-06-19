export interface NewbornDeathStoreType {
  id: string;
  mother: string;
  child_id?: string | null;
  mother_name: string;
  baby_name?: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  death_day?: number;
  death_month?: number;
  death_year?: number;
  birth_condition: string; // 'Preterm', 'LowWeight', 'Normal', 'Other'
  birth_condition_other?: string;
  death_age_days: number;
  death_age_unit: 'days' | 'months'; // 'days' or 'months'
  cause_of_death: string; // 'Asphyxia', 'Hypothermia', 'Infection', 'Pneumonia', 'Diarrhea', 'Malnutrition', 'Other'
  cause_of_death_other?: string;
  death_place: string; // 'Home', 'Institution', 'Other'
  death_place_other?: string;
  gender?: 'Male' | 'Female';
  remarks: string;
  reg_year?: number | null;
  reg_month?: number | string | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}
