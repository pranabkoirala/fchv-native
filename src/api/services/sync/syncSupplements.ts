import { unSyncedSupplements } from "@/hooks/database/models/SupplementModel";
import { postBulkSupplements } from "../supplements/mutation";
import { fetchSupplementsFromServer } from "../supplements/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedSupplementsToServer() {
  await sendUnsyncedToServer(
    unSyncedSupplements,
    postBulkSupplements,
    "supplements",
  );
}

export async function getUnsyncedSupplementsFromServer(
  last_synced_at: string | null,
) {
  await fetchSupplementsFromServer({
    sync_timestamp: last_synced_at,
  });
}
