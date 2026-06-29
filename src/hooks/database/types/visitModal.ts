export type VisitType = 'ANC' | 'PNC' | 'OTHER';

export type VisitStoreType = {
  id: string;
  mother: string;
  name: string | null;
  is_synced: number;
  is_deleted: number;
  visit_date: string;
  visit_type: VisitType;
  visit_place: string | null;
  visit_number?: number | null;
  reg_year?: number | null;
  reg_month: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateVisitPayload = {
  id?: string;
  mother: string;
  name?: string;
  visit_date: string;
  visit_type: VisitType;
  visit_place?: string;
  visit_number?: number;
  is_synced?: boolean;
};
