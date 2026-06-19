import { unSyncedVisits } from "@/hooks/database/models/VisitModel";
import { postBulkVisits } from "../visit/mutation";
import { fetchVisitsFromServer } from "../visit/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedVisitsToServer() {
  await sendUnsyncedToServer(unSyncedVisits, postBulkVisits, "visit");
}

export async function getUnsyncedVisitsFromServer(
  last_synced_at: string | null,
) {
  await fetchVisitsFromServer({
    sync_timestamp: last_synced_at,
  });
}
