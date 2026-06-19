import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { FamilyPlanningStoreType } from "@/hooks/database/models/FamilyPlanningModel";

const mapFamilyPlanningToSyncPayload = (data: FamilyPlanningStoreType) => ({
  id: data.id,
  mother: data.mother,
  pregnancy_id: data.pregnancy_id ?? null,
  family_planning: data.family_planning,
  ocp_qty: data.ocp_qty ?? 0,
  ecp_qty: data.ecp_qty ?? 0,
  condom_qty: data.condom_qty ?? 0,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkFamilyPlanning = async (data: FamilyPlanningStoreType[]) => {
  const response = await httpClient.post<FamilyPlanningStoreType[]>(
    API_LIST.family_planning.post,
    data.map(mapFamilyPlanningToSyncPayload),
  );

  return response.data;
};

export { postBulkFamilyPlanning };
