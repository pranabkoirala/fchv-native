import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { ChildCounselingStoreType } from "@/hooks/database/models/ChildCounselingModel";

const mapChildCounselingToSyncPayload = (data: ChildCounselingStoreType) => ({
  id: data.id,
  child: data.child,
  answers: data.answers ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkChildCounseling = async (data: ChildCounselingStoreType[]) => {
  const response = await httpClient.post<ChildCounselingStoreType[]>(
    API_LIST.child_counseling.post,
    data.map(mapChildCounselingToSyncPayload),
  );

  return response.data;
};

export { postBulkChildCounseling };
