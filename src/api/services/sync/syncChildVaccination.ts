import { unSyncedChildVaccination } from "@/hooks/database/models/ChildVaccinationModel";
import { postBulkChildVaccination } from "../childVaccination/mutation";
import { fetchChildVaccinationFromServer } from "../childVaccination/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildVaccinationToServer() {
  await sendUnsyncedToServer(
    unSyncedChildVaccination,
    postBulkChildVaccination,
    "child_vaccination",
  );
}

export async function getUnsyncedChildVaccinationFromServer(
  last_synced_at: string | null,
) {
  await fetchChildVaccinationFromServer({
    sync_timestamp: last_synced_at,
  });
}
