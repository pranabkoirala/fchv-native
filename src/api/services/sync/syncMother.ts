import { markAsSynced } from "./helper";
import { unSyncedMothers } from "@/hooks/database/models/MotherModel";
import { postMother } from "../mother/mutation";

export async function sendUnsyncedMothersToServer() {
  const unsynced = await unSyncedMothers();
  if (!unsynced.length) return;

  for (const item of unsynced) {
    try {
      const response = await postMother(item);
      if (response && response.id) {
        await markAsSynced("mother", response.id, true);
      }
    } catch (error) {
      console.error(`Failed to sync mother with ID ${item.id}:`, error);
    }
  }
}
