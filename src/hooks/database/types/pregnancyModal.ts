export type PregnancyStoreType = {
  id: string;
  mother_id: string | null;
  is_synced: number;
  is_deleted: number;
  gravida: number | null;
  parity: number | null;
  lmp_date: string;
  expected_delivery_date: string | null;
  caretakers_name: string | null;
  caretakers_phone: string | null;
  is_current: number;
  selected: number;
  created_at: string;
  updated_at: string;
};

export interface PregnancyData {
  id: string;
  gravida: number;
  parity: number;
  lmp_date: string;
  expected_delivery_date: string;
  caretakers_name?: string;
  caretakers_phone?: string;
  created_at: string;
  updated_at: string;
}

export type CreatePregnancyPayload = {
  id: string;
  mother_id: string;
  gravida?: number;
  parity?: number;
  lmp_date: string;
  expected_delivery_date?: string;
  caretakers_name?: string;
  caretakers_phone?: string;
  is_current?: boolean;
  selected: boolean;
  is_synced?: boolean;
};
