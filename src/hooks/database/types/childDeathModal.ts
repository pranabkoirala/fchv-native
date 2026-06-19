export interface ChildDeathStoreType {
  id: string;
  mother: string;
  mother_name: string;
  child_name?: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  death_age_months: number;
  cause_of_death: string;
  gender?: 'Male' | 'Female';
  remarks: string;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}
