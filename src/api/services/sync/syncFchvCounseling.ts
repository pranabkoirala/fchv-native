import { unSyncedFchvCounseling } from "@/hooks/database/models/FchvCounselingModel";
import { postBulk } from "../fchvCounseling/mutation";
import { fetchFromServer } from "../fchvCounseling/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedFchvCounselingToServer() {
  await sendUnsyncedToServer(
    unSyncedFchvCounseling,
    postBulk,
    "fchv_counseling",
  );
}

export async function getUnsyncedFchvCounselingFromServer(
  last_synced_at: string | null,
) {
  await fetchFromServer({ sync_timestamp: last_synced_at });
}
