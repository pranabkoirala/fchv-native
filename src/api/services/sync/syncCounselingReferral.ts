import { unSyncedCounselingReferral } from "@/hooks/database/models/CounselingReferralModel";
import { postBulkCounselingReferral } from "../counselingReferral/mutation";
import { fetchCounselingReferralFromServer } from "../counselingReferral/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedCounselingReferralToServer() {
  await sendUnsyncedToServer(
    unSyncedCounselingReferral,
    postBulkCounselingReferral,
    "counseling_referral",
  );
}

export async function getUnsyncedCounselingReferralFromServer(
  last_synced_at: string | null,
) {
  await fetchCounselingReferralFromServer({
    sync_timestamp: last_synced_at,
  });
}
