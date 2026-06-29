import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { DeliveryStoreType } from "@/hooks/database/types/deliveryModal";

// ─── Payload mapper ───────────────────────────────────────────────────────────

/**
 * Converts a local DeliveryStoreType into the API payload shape.
 * The server expects `pregnancy` (not `pregnancy_id`) and a boolean `deleted`.
 */
const mapDeliveryToSyncPayload = (data: DeliveryStoreType) => ({
  id: data.id,
  mother: data.mother ?? null,
  delivery_date: data.delivery_date ?? null,
  delivery_place: data.delivery_place ?? null,
  baby_weight: data.baby_weight ?? null,
  gender: data.gender ?? null,
  status: data.status ?? "alive",
  fchv_present: data.fchv_present ?? 0,
  skilled_birth_attended: data.skilled_birth_attended ?? 0,
  asphyxiated_newborn: data.asphyxiated_newborn ?? 0,
  umbilical_ointment: data.umbilical_ointment ?? 0,
  skin_to_skin: data.skin_to_skin ?? 0,
  early_breastfeeding: data.early_breastfeeding ?? 0,
  remarks: data.remarks ?? null,
  pregnancy: data.pregnancy_id ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Syncs a batch of local delivery records to the server (POST bulk-sync).
 * Returns the server's canonical response so we can confirm each record was
 * accepted and mark it as is_synced = 1 locally.
 */
export const postBulkDeliveries = async (
  data: DeliveryStoreType[],
): Promise<DeliveryStoreType[]> => {
  const response = await httpClient.post<DeliveryStoreType[]>(
    API_LIST.delivery.post,
    data.map(mapDeliveryToSyncPayload),
  );
  return response.data;
};

/**
 * Patches a single delivery record on the server (used for targeted updates).
 */
export const patchDelivery = async (
  id: string,
  data: Partial<DeliveryStoreType>,
): Promise<DeliveryStoreType> => {
  const url = API_LIST.delivery.patch.replace("{id}", id);
  const response = await httpClient.patch<DeliveryStoreType>(
    url,
    mapDeliveryToSyncPayload({ ...data, id } as DeliveryStoreType),
  );
  return response.data;
};
