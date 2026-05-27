export type VisitType = 'ANC' | 'PNC';

export type VisitStoreType = {
  id: string;
  mother_id: string;
  name: string | null;
  address: string | null;
  is_synced: number;
  is_deleted: number;
  visit_date: string;
  visit_type: VisitType;
  visit_notes: string | null;
  reg_year?: number | null;
  reg_month: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateVisitPayload = {
  id?: string;
  mother_id: string;
  name?: string;
  address?: string;
  visit_date: string;
  visit_type: VisitType;
  visit_notes?: string;
  is_synced?: boolean;
};
