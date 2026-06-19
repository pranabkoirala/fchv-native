import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { ChildVaccinationStoreType } from "@/hooks/database/models/ChildVaccinationModel";

const mapChildVaccinationToSyncPayload = (data: ChildVaccinationStoreType) => ({
  id: data.id,
  child: data.child,
  vaccine_id: data.vaccine_id,
  is_given: data.is_given,
  given_date: data.given_date ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkChildVaccination = async (data: ChildVaccinationStoreType[]) => {
  const response = await httpClient.post<ChildVaccinationStoreType[]>(
    API_LIST.child_vaccination.post,
    data.map(mapChildVaccinationToSyncPayload),
  );

  return response.data;
};

export { postBulkChildVaccination };
