
import { DeviceEventEmitter } from "react-native";
import { API_LIST } from "../../API_LIST";
import { httpClient } from "../../client/httpClient";
import { SyncTableType, TableType } from "@/hooks/database/types/table";
import { getTablesWithTimestamp } from "@/hooks/database/models/SyncModel";
import { getUnsyncedPregnancyFromServer, sendUnsyncedPregnancyToServer } from "./syncPregnancy";
import { sendUnsyncedMothersToServer } from "./syncMother";
import { getSelectedPregnancy } from "@/hooks/database/models/PregnantWomenModal";
import storage from "@/utils/storage";
import { ACCESS_TOKEN_KEY } from "@/constants/token";

const SYNCERS: Partial<
  Record<SyncTableType, (last_synced_at: string | null) => Promise<void>>
> = {
  pregnancy: (last_synced_at: string | null) =>
    getUnsyncedPregnancyFromServer(last_synced_at),
};

export let isGlobalSyncRunning = false;

const doSync = async (sendOnly?: boolean) => {
  // Skip sync if user is not logged in
  const token = await storage.get(ACCESS_TOKEN_KEY);
  if (!token) return;

  isGlobalSyncRunning = true;
  DeviceEventEmitter.emit("sync.started");

  try {
    // Push local unsynced data to server
    await sendUnsyncedMothersToServer();
    await sendUnsyncedPregnancyToServer();

    if (sendOnly) return;

    const timestamps = await getTablesWithTimestamp();
    // const rawTables = (await fetchUnsyncedTablesFromServer(timestamps)) || [];

    // for (const table of rawTables) {
    //   const fn = SYNCERS[table];
    //   if (!fn) continue;

    //   try {
    //     const last_synced_at = timestamps[table as TableType] ?? null;
    //     console.log(`[SYNC] start ${table}`);
    //     await fn(last_synced_at);
    //     console.log(`[SYNC] done  ${table}`);
    //   } catch (e) {
    //     console.error(`[SYNC] fail  ${table}`, e);
    //   }
    // }
  } catch (e) {
    console.error("[SYNC] error:", e);
  } finally {
    isGlobalSyncRunning = false;
    DeviceEventEmitter.emit("sync.completed");
  }
};

const fetchUnsyncedTablesFromServer = async (
  timestamps: Record<TableType, string | null>
) => {
  try {
    const pregnancy = await getSelectedPregnancy();
    if (!pregnancy) throw new Error("No selected pregnancy found");
    const pregnancy_id = pregnancy.id;

    const response = await httpClient.post<SyncTableType[]>(
      `${API_LIST.sync.unsynced_table_list}/${pregnancy_id}`,
      timestamps
    );
    return response.data;
  } catch (err) {
    console.error("Failed to fetch unsynced tables from server", err);
  }
};

export { doSync, fetchUnsyncedTablesFromServer };

