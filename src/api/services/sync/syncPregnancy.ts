
import { markAsSynced } from "./helper";
// import { fetchPregnancyFromServer } from "../pregnantWomen/queries";
import { unSyncedPregnancies } from "@/hooks/database/models/PregnantWomenModal";
import { postPregnancy } from "../pregnantWomen/mutation";

export async function sendUnsyncedPregnancyToServer() {
  const unsynced = await unSyncedPregnancies();
  if (!unsynced.length) return;

  for (const item of unsynced) {
    try {
      const response = await postPregnancy(item);
      if (response && response.id) {
        await markAsSynced("pregnancy", response.id, true);
      }
    } catch (error) {
      console.error(`Failed to sync pregnancy with ID ${item.id}:`, error);
    }
  }
}

export async function getUnsyncedPregnancyFromServer(
  last_synced_at: string | null
) {
  // await fetchPregnancyFromServer({
  //   sync_timestamp: last_synced_at
  // });
}

export async function syncKickCounter() {
  await sendUnsyncedPregnancyToServer();
}
