import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { PncVisitStoreType } from "@/hooks/database/types/pncVisitModal";

const mapPncVisitToSyncPayload = (data: PncVisitStoreType) => ({
  id: data.id,
  mother: data.mother,
  name: data.name ?? null,
  visit_date: data.visit_date,
  visit_place: data.visit_place ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postPncVisit = async (data: PncVisitStoreType) => {
  const response = await httpClient.post<PncVisitStoreType | PncVisitStoreType[]>(
    API_LIST.pnc_visits.post,
    [mapPncVisitToSyncPayload(data)],
  );

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkPncVisits = async (data: PncVisitStoreType[]) => {
  const response = await httpClient.post<PncVisitStoreType[]>(
    API_LIST.pnc_visits.post,
    data.map(mapPncVisitToSyncPayload),
  );

  return response.data;
};

export { postBulkPncVisits, postPncVisit };
