import { unSyncedAbortions } from "@/hooks/database/models/AbortionModel";
import { postBulkAbortions } from "../abortion/mutation";
import { fetchAbortionsFromServer } from "../abortion/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedAbortionsToServer() {
  await sendUnsyncedToServer(
    unSyncedAbortions,
    postBulkAbortions,
    "abortion",
  );
}

export async function getUnsyncedAbortionsFromServer(
  last_synced_at: string | null,
) {
  await fetchAbortionsFromServer({
    sync_timestamp: last_synced_at,
  });
}
