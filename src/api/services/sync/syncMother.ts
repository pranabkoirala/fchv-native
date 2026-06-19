import { unSyncedMothers } from "@/hooks/database/models/MotherModel";
import { postBulkMother } from "../mother/mutation";
import { fetchMothersFromServer } from "../mother/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedMothersToServer() {
  await sendUnsyncedToServer(
    unSyncedMothers,
    postBulkMother,
    "mother"
  );
}

export async function getUnsyncedMothersFromServer(
  last_synced_at: string | null,
) {
  await fetchMothersFromServer({ sync_timestamp: last_synced_at });
}
