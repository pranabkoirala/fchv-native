import { getDb } from "@/hooks/database/db";
import { TableType } from "@/hooks/database/types/table";

export async function markAsSynced(
  tableName: TableType,
  id: string,
  synced: boolean
) {
  const db = await getDb();
  await db.runAsync(`UPDATE ${tableName} SET is_synced = ? WHERE id = ?;`, [
    synced ? 1 : 0,
    id
  ]);
}

export async function sendUnsyncedToServer<Local extends { id: string }, Server extends { id: string }>(
  fetchFn: () => Promise<Local[]>,
  postFn: (payload: Local[]) => Promise<Server[]>,
  tableName: TableType
) {
  // Fetch local data that are unsynced i.e is_synced being 0 :)
  const unsynced = await fetchFn();
  if (!unsynced.length) return; // assume it's synced

  // Then sending those data to server
  const response: Server[] = await postFn(unsynced);

  // Creating local map so we can compare the response from server and the payload we sent. Basically double checking if server has sent us back the data we sent for syncing
  const localMap = new Map<string, { id: string }>();

  unsynced.forEach((local) => {
    localMap.set(local.id, local);
  });

  for (const serverItem of response) {
    const localMatch = localMap.get(serverItem.id);

    if (localMatch) {
      await markAsSynced(tableName, localMatch.id, true);
    }
  }
}
