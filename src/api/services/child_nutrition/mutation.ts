import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { ChildNutritionStoreType } from "@/hooks/database/models/ChildNutritionModel";

const mapChildNutritionToSyncPayload = (data: ChildNutritionStoreType) => ({
  id: data.id,
  mother_id: data.mother_id,
  child_id: data.child_id,
  nutrition_names: data.nutrition_names,
  balvita_packets: data.balvita_packets,
  child_age_group: data.child_age_group ?? null,
  times_per_month: data.times_per_month ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkChildNutrition = async (data: ChildNutritionStoreType[]) => {
  const response = await httpClient.post<ChildNutritionStoreType[]>(
    API_LIST.child_nutrition.post,
    data.map(mapChildNutritionToSyncPayload),
  );
  return response.data;
};

export { postBulkChildNutrition };
