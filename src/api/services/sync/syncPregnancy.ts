
import { unSyncedPregnancies } from "@/hooks/database/models/PregnantWomenModal";
import { postBulkPregnancy } from "../pregnantWomen/mutation";
import { fetchPregnanciesFromServer } from "../pregnantWomen/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedPregnancyToServer() {
  await sendUnsyncedToServer(
    unSyncedPregnancies,
    postBulkPregnancy,
    "pregnancy"
  );
}

export async function getUnsyncedPregnancyFromServer(
  last_synced_at: string | null
) {
  await fetchPregnanciesFromServer({
    sync_timestamp: last_synced_at
  });
}

export async function syncKickCounter() {
  await sendUnsyncedPregnancyToServer();
}
