import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { AdolescentIfaStoreType } from "@/hooks/database/types/adolescentIfaModal";

const mapAdolescentIfaToSyncPayload = (data: AdolescentIfaStoreType) => ({
  id: data.id,
  name: data.name,
  age_group: data.age_group,
  phase1_week_1: data.phase1_week_1,
  phase1_week_2: data.phase1_week_2,
  phase1_week_3: data.phase1_week_3,
  phase1_week_4: data.phase1_week_4,
  phase1_week_5: data.phase1_week_5,
  phase1_week_6: data.phase1_week_6,
  phase1_week_7: data.phase1_week_7,
  phase1_week_8: data.phase1_week_8,
  phase1_week_9: data.phase1_week_9,
  phase1_week_10: data.phase1_week_10,
  phase1_week_11: data.phase1_week_11,
  phase1_week_12: data.phase1_week_12,
  phase1_week_13: data.phase1_week_13,
  phase1_completed: data.phase1_completed,
  phase2_week_1: data.phase2_week_1,
  phase2_week_2: data.phase2_week_2,
  phase2_week_3: data.phase2_week_3,
  phase2_week_4: data.phase2_week_4,
  phase2_week_5: data.phase2_week_5,
  phase2_week_6: data.phase2_week_6,
  phase2_week_7: data.phase2_week_7,
  phase2_week_8: data.phase2_week_8,
  phase2_week_9: data.phase2_week_9,
  phase2_week_10: data.phase2_week_10,
  phase2_week_11: data.phase2_week_11,
  phase2_week_12: data.phase2_week_12,
  phase2_week_13: data.phase2_week_13,
  phase2_completed: data.phase2_completed,
  remarks: data.remarks || null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postAdolescentIfa = async (data: AdolescentIfaStoreType) => {
  const response = await httpClient.post<
    AdolescentIfaStoreType | AdolescentIfaStoreType[]
  >(API_LIST.adolescents.post, [mapAdolescentIfaToSyncPayload(data)]);

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkAdolescentIfa = async (data: AdolescentIfaStoreType[]) => {
  const response = await httpClient.post<AdolescentIfaStoreType[]>(
    API_LIST.adolescents.post,
    data.map(mapAdolescentIfaToSyncPayload)
  );

  return response.data;
};

export { postAdolescentIfa, postBulkAdolescentIfa };
