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
  ended: number;
  delivered: number;
  risk_level: string;
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
  name?: string;
  gravida?: number;
  parity?: number;
  lmp_date: string;
  expected_delivery_date?: string;
  caretakers_name?: string;
  caretakers_phone?: string;
  is_current?: boolean;
  selected: boolean;
  ended?: boolean;
  delivered?: boolean;
  risk_level?: 'high' | 'moderate' | 'normal';
  is_synced?: boolean;
};

export type PregnancySyncPayload = {
  id: string;
  name: string;
  lmp_date: string;
  caretakers_name: string;
  caretakers_phone: string;
  mother: string;
  expected_delivery_date: string;
  is_current: boolean;
  parity: number;
  selected: boolean;
  ended: boolean;
  delivered: boolean;
  risk_level: string;
};
