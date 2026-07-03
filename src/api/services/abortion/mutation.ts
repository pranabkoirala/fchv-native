import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { AbortionStoreType } from "@/hooks/database/types/abortionModal";

const mapAbortionToSyncPayload = (data: AbortionStoreType) => ({
  id: data.id,
  mother: data.mother,
  pregnancy: data.pregnancy ?? null,
  aborted: data.aborted ?? 0,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkAbortions = async (data: AbortionStoreType[]) => {
  const response = await httpClient.post<AbortionStoreType[]>(
    API_LIST.abortion.post,
    data.map(mapAbortionToSyncPayload),
  );
  return response.data;
};

export { postBulkAbortions };
