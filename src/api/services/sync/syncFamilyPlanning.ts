import { unSyncedFamilyPlanning } from "@/hooks/database/models/FamilyPlanningModel";
import { postBulkFamilyPlanning } from "../familyPlanning/mutation";
import { fetchFamilyPlanningFromServer } from "../familyPlanning/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedFamilyPlanningToServer() {
  await sendUnsyncedToServer(
    unSyncedFamilyPlanning,
    postBulkFamilyPlanning,
    "family_planning",
  );
}

export async function getUnsyncedFamilyPlanningFromServer(
  last_synced_at: string | null,
) {
  await fetchFamilyPlanningFromServer({
    sync_timestamp: last_synced_at,
  });
}
