import { unSyncedNewbornDeaths } from "@/hooks/database/models/NewbornDeathModel";
import { postBulkNewbornDeaths } from "../newbornDeath/mutation";
import { fetchNewbornDeathsFromServer } from "../newbornDeath/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedNewbornDeathsToServer() {
  await sendUnsyncedToServer(
    unSyncedNewbornDeaths,
    postBulkNewbornDeaths,
    "hmis_newborn_death",
  );
}

export async function getUnsyncedNewbornDeathsFromServer(
  last_synced_at: string | null,
) {
  await fetchNewbornDeathsFromServer({
    sync_timestamp: last_synced_at,
  });
}
