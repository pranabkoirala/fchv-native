import { unSyncedPncVisits } from "@/hooks/database/models/PncVisitModel";
import { postBulkPncVisits } from "../pnc_visit/mutation";
import { fetchPncVisitsFromServer } from "../pnc_visit/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedPncVisitsToServer() {
  await sendUnsyncedToServer(unSyncedPncVisits, postBulkPncVisits, "pnc_visit");
}

export async function getUnsyncedPncVisitsFromServer(
  last_synced_at: string | null,
) {
  await fetchPncVisitsFromServer({
    sync_timestamp: last_synced_at,
  });
}
