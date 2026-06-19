import { unSyncedMaternalDeaths } from "@/hooks/database/models/MaternalDeathModel";
import { postBulkMaternalDeaths } from "../maternalDeath/mutation";
import { fetchMaternalDeathsFromServer } from "../maternalDeath/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedMaternalDeathsToServer() {
  await sendUnsyncedToServer(
    unSyncedMaternalDeaths,
    postBulkMaternalDeaths,
    "hmis_maternal_death",
  );
}

export async function getUnsyncedMaternalDeathsFromServer(
  last_synced_at: string | null,
) {
  await fetchMaternalDeathsFromServer({
    sync_timestamp: last_synced_at,
  });
}
