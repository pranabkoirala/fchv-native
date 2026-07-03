import { unSyncedChildDeathRegistrations } from "@/hooks/database/models/ChildDeathRegistrationModel";
import { postBulk } from "../childDeathRegistration/mutation";
import { fetchFromServer } from "../childDeathRegistration/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildDeathRegistrationsToServer() {
  await sendUnsyncedToServer(
    unSyncedChildDeathRegistrations,
    postBulk,
    "child_death_registration",
  );
}

export async function getUnsyncedChildDeathRegistrationsFromServer(
  last_synced_at: string | null,
) {
  await fetchFromServer({ sync_timestamp: last_synced_at });
}
