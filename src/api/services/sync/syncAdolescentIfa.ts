import { unSyncedAdolescentIfa } from "@/hooks/database/models/AdolescentIfaModel";
import { postBulkAdolescentIfa } from "../adolescent/mutation";
import { fetchAdolescentIfaFromServer } from "../adolescent/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedAdolescentIfaToServer() {
  await sendUnsyncedToServer(
    unSyncedAdolescentIfa,
    postBulkAdolescentIfa,
    "adolescent_ifa"
  );
}

export async function getUnsyncedAdolescentIfaFromServer(
  last_synced_at: string | null
) {
  await fetchAdolescentIfaFromServer({
    sync_timestamp: last_synced_at
  });
}
