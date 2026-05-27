export interface AdolescentIfaStoreType {
  id: string;
  name: string;
  age_group: string; // '10-14' or '15-19'
  phase1_week_1: number;
  phase1_week_2: number;
  phase1_week_3: number;
  phase1_week_4: number;
  phase1_week_5: number;
  phase1_week_6: number;
  phase1_week_7: number;
  phase1_week_8: number;
  phase1_week_9: number;
  phase1_week_10: number;
  phase1_week_11: number;
  phase1_week_12: number;
  phase1_week_13: number;
  phase1_completed: number;
  phase2_week_1: number;
  phase2_week_2: number;
  phase2_week_3: number;
  phase2_week_4: number;
  phase2_week_5: number;
  phase2_week_6: number;
  phase2_week_7: number;
  phase2_week_8: number;
  phase2_week_9: number;
  phase2_week_10: number;
  phase2_week_11: number;
  phase2_week_12: number;
  phase2_week_13: number;
  phase2_completed: number;
  remarks?: string;
  reg_year?: number;
  reg_month?: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export type CreateAdolescentIfaPayload = Omit<
  AdolescentIfaStoreType,
  'is_synced' | 'is_deleted' | 'created_at' | 'updated_at'
>;
