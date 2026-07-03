export interface ChildBirthRegistrationStoreType {
  id: string;
  child: string;
  birth_status: number;
  reg_year: number | null;
  reg_month: number | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}
