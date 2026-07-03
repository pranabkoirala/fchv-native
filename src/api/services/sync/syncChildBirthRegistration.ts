import { unSyncedChildBirthRegistrations } from "@/hooks/database/models/ChildBirthRegistrationModel";
import { postBulk } from "../childBirthRegistration/mutation";
import { fetchFromServer } from "../childBirthRegistration/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildBirthRegistrationsToServer() {
  await sendUnsyncedToServer(
    unSyncedChildBirthRegistrations,
    postBulk,
    "child_birth_registration",
  );
}

export async function getUnsyncedChildBirthRegistrationsFromServer(
  last_synced_at: string | null,
) {
  await fetchFromServer({ sync_timestamp: last_synced_at });
}
