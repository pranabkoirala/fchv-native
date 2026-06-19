import { unSyncedChildCounseling } from "@/hooks/database/models/ChildCounselingModel";
import { postBulkChildCounseling } from "../childCounseling/mutation";
import { fetchChildCounselingFromServer } from "../childCounseling/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildCounselingToServer() {
  await sendUnsyncedToServer(
    unSyncedChildCounseling,
    postBulkChildCounseling,
    "child_counseling",
  );
}

export async function getUnsyncedChildCounselingFromServer(
  last_synced_at: string | null,
) {
  await fetchChildCounselingFromServer({
    sync_timestamp: last_synced_at,
  });
}
