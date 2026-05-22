export interface MaternalDeathStoreType {
  id: string;
  mother_id?: string;
  serial_no?: number;
  mother_name?: string;
  mother_age?: number;
  death_condition?: string; // 'Pregnant', 'Labor', 'Post-delivery', 'Other'
  death_condition_other?: string;
  death_day?: number;
  death_month?: number;
  death_year?: number;
  delivery_place?: string; // 'Home', 'Institution', 'Other'
  delivery_place_other?: string;
  death_place?: string; // 'Home', 'Institution', 'Other'
  death_place_other?: string;
  child_condition?: string; // 'Alive', 'Dead'
  remarks?: string;
  is_synced?: number;
  is_deleted?: number;
  created_at: string;
  updated_at: string;
}

export type CreateMaternalDeathPayload = Omit<MaternalDeathStoreType, 'created_at' | 'updated_at' | 'is_synced' | 'is_deleted'>;
