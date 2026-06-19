export type FamilyPlanningSyncPayload = {
  id: string;
  mother: string;
  pregnancy_id: string | null;
  family_planning: string;
  ocp_qty: number;
  ecp_qty: number;
  condom_qty: number;
  reg_year?: number | null;
  reg_month?: number | null;
  updated_at: string;
  deleted: boolean;
};
