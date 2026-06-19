import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { NewbornDeathStoreType } from "@/hooks/database/types/newbornDeathModal";

const mapNewbornDeathToSyncPayload = (data: NewbornDeathStoreType) => ({
  id: data.id,
  mother: data.mother ?? null,
  child_id: data.child_id ?? null,
  mother_name: data.mother_name ?? null,
  baby_name: data.baby_name ?? null,
  birth_day: data.birth_day ?? null,
  birth_month: data.birth_month ?? null,
  birth_year: data.birth_year ?? null,
  death_day: data.death_day ?? null,
  death_month: data.death_month ?? null,
  death_year: data.death_year ?? null,
  birth_condition: data.birth_condition ?? null,
  birth_condition_other: data.birth_condition_other ?? null,
  death_age_days: data.death_age_days ?? null,
  death_age_unit: data.death_age_unit ?? "days",
  cause_of_death: data.cause_of_death ?? null,
  cause_of_death_other: data.cause_of_death_other ?? null,
  death_place: data.death_place ?? null,
  death_place_other: data.death_place_other ?? null,
  gender: data.gender ?? null,
  remarks: data.remarks ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postNewbornDeath = async (data: NewbornDeathStoreType) => {
  const response = await httpClient.post<
    NewbornDeathStoreType | NewbornDeathStoreType[]
  >(API_LIST.newBorn_death.post, [mapNewbornDeathToSyncPayload(data)]);

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkNewbornDeaths = async (data: NewbornDeathStoreType[]) => {
  const response = await httpClient.post<NewbornDeathStoreType[]>(
    API_LIST.newBorn_death.post,
    data.map(mapNewbornDeathToSyncPayload),
  );

  return response.data;
};

export { postBulkNewbornDeaths, postNewbornDeath };
