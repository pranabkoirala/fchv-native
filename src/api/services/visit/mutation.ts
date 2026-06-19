import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { VisitStoreType } from "@/hooks/database/types/visitModal";

const mapVisitToSyncPayload = (data: VisitStoreType) => ({
  id: data.id,
  mother: data.mother,
  name: data.name ?? null,
  visit_date: data.visit_date,
  visit_type: data.visit_type,
  visit_place: data.visit_place ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postVisit = async (data: VisitStoreType) => {
  const response = await httpClient.post<VisitStoreType | VisitStoreType[]>(
    API_LIST.visits.post,
    [mapVisitToSyncPayload(data)],
  );

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkVisits = async (data: VisitStoreType[]) => {
  const response = await httpClient.post<VisitStoreType[]>(
    API_LIST.visits.post,
    data.map(mapVisitToSyncPayload),
  );

  return response.data;
};

export { postBulkVisits, postVisit };
