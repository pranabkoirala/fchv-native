import { unSyncedChildNutrition } from "@/hooks/database/models/ChildNutritionModel";
import { postBulkChildNutrition } from "../child_nutrition/mutation";
import { fetchChildNutritionFromServer } from "../child_nutrition/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildNutritionToServer() {
  await sendUnsyncedToServer(
    unSyncedChildNutrition,
    postBulkChildNutrition,
    "child_nutrition",
  );
}

export async function getUnsyncedChildNutritionFromServer(
  last_synced_at: string | null,
) {
  await fetchChildNutritionFromServer({
    sync_timestamp: last_synced_at,
  });
}
