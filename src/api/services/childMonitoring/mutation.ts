import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";

const mapChildMonitoringToSyncPayload = (data: InfantMonitoringStoreType) => ({
  id: data.id,
  mother: data.mother ?? null,
  baby_name: data.baby_name ?? null,
  date_of_birth: data.date_of_birth ?? null,
  birth_place: data.birth_place ?? null,
  status: data.status ?? "alive",
  fchv_present: data.fchv_present ?? 0,
  skilled_birth_attended: data.skilled_birth_attended ?? 0,
  baby_weight: data.baby_weight ?? null,
  umbilical_ointment: data.umbilical_ointment ?? 0,
  skin_to_skin: data.skin_to_skin ?? 0,
  early_breastfeeding: data.early_breastfeeding ?? 0,
  asphyxiated_newborn: data.asphyxiated_newborn ?? 0,
  is_all_given: data.is_all_given ?? 0,
  gender: data.gender ?? null,
  remarks: data.remarks ?? null,
  pregnancy: data.pregnancy_id ?? null,
  registration_source: data.registration_source ?? "DIRECT_CHILD_REGISTRATION",
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postChildMonitoring = async (data: InfantMonitoringStoreType) => {
  const response = await httpClient.post<
    InfantMonitoringStoreType | InfantMonitoringStoreType[]
  >(API_LIST.child_monitoring.post, [mapChildMonitoringToSyncPayload(data)]);

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkChildMonitoring = async (data: InfantMonitoringStoreType[]) => {
  const response = await httpClient.post<InfantMonitoringStoreType[]>(
    API_LIST.child_monitoring.post,
    data.map(mapChildMonitoringToSyncPayload),
  );

  return response.data;
};

export { postBulkChildMonitoring, postChildMonitoring };
