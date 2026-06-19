import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { MaternalDeathStoreType } from "@/hooks/database/types/maternalDeathModal";

const mapMaternalDeathToSyncPayload = (data: MaternalDeathStoreType) => ({
  id: data.id,
  mother: data.mother ?? null,
  serial_no: data.serial_no ?? null,
  mother_name: data.mother_name ?? null,
  mother_age: data.mother_age ?? null,
  death_condition: data.death_condition ?? null,
  death_condition_other: data.death_condition_other ?? null,
  death_day: data.death_day ?? null,
  death_month: data.death_month ?? null,
  death_year: data.death_year ?? null,
  death_place: data.death_place ?? null,
  death_place_other: data.death_place_other ?? null,
  child_condition: data.child_condition ?? null,
  remarks: data.remarks ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postMaternalDeath = async (data: MaternalDeathStoreType) => {
  const response = await httpClient.post<
    MaternalDeathStoreType | MaternalDeathStoreType[]
  >(API_LIST.maternal_death.post, [mapMaternalDeathToSyncPayload(data)]);

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkMaternalDeaths = async (data: MaternalDeathStoreType[]) => {
  const response = await httpClient.post<MaternalDeathStoreType[]>(
    API_LIST.maternal_death.post,
    data.map(mapMaternalDeathToSyncPayload),
  );

  return response.data;
};

export { postBulkMaternalDeaths, postMaternalDeath };
