import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { CounselingReferralStoreType } from "@/hooks/database/models/CounselingReferralModel";

const mapCounselingReferralToSyncPayload = (data: CounselingReferralStoreType) => ({
  id: data.id,
  mother: data.mother,
  pregnancy: data.pregnancy ?? null,
  answers: data.answers ?? null,
  counseling_answers: data.counseling_answers ?? null,
  referral_answers: data.referral_answers ?? null,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulkCounselingReferral = async (data: CounselingReferralStoreType[]) => {
  const response = await httpClient.post<CounselingReferralStoreType[]>(
    API_LIST.counseling_referral.post,
    data.map(mapCounselingReferralToSyncPayload),
  );

  return response.data;
};

export { postBulkCounselingReferral };
