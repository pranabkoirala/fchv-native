export interface DeliveryStoreType {
  id: string;
  mother?: string;
  delivery_date?: string;
  delivery_place?: string;
  baby_weight?: string;
  gender?: "Male" | "Female";
  status?: string;
  fchv_present: number;
  skilled_birth_attended: number;
  asphyxiated_newborn: number;
  umbilical_ointment: number;
  skin_to_skin: number;
  early_breastfeeding: number;
  remarks?: string;
  pregnancy_id?: string | null;
  reg_year?: number;
  reg_month?: number;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export type CreateDeliveryPayload = Omit<
  DeliveryStoreType,
  "is_synced" | "is_deleted" | "created_at" | "updated_at"
>;
