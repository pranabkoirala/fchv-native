import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { SupplementStoreType } from "@/hooks/database/models/SupplementModel";

const mapSupplementToSyncPayload = (data: SupplementStoreType) => ({
  id: data.id,
  mother: data.mother,
  pregnancy_id: data.pregnancy_id ?? null,
  iron_pregnancy: data.iron_pregnancy ?? 0,
  iron_post_delivery: data.iron_post_delivery ?? 0,
  vitamin_a_post_delivery: data.vitamin_a_post_delivery ?? 0,
  calcium: data.calcium ?? 0,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postSupplement = async (data: SupplementStoreType) => {
  const response = await httpClient.post<
    SupplementStoreType | SupplementStoreType[]
  >(API_LIST.supplements.post, [mapSupplementToSyncPayload(data)]);

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkSupplements = async (data: SupplementStoreType[]) => {
  const response = await httpClient.post<SupplementStoreType[]>(
    API_LIST.supplements.post,
    data.map(mapSupplementToSyncPayload),
  );

  return response.data;
};

export { postBulkSupplements, postSupplement };
