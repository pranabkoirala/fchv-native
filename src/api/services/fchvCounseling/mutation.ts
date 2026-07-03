import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { FchvCounselingStoreType } from "@/hooks/database/models/FchvCounselingModel";

const mapToSyncPayload = (data: FchvCounselingStoreType) => ({
  id: data.id,
  fchv_name: data.fchv_name,
  fchv_id: data.fchv_id,
  data: data.data,
  reg_year: data.reg_year,
  reg_month: data.reg_month,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulk = async (data: FchvCounselingStoreType[]) => {
  const response = await httpClient.post<FchvCounselingStoreType[]>(
    API_LIST.fchv_counseling.post,
    data.map(mapToSyncPayload),
  );
  return response.data;
};

export { postBulk };
