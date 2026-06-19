import { ACCESS_TOKEN_KEY } from "@/constants/token";
import { initDatabase } from "@/hooks/database/db";
import { getTablesWithTimestamp } from "@/hooks/database/models/SyncModel";
import { SyncTableType, TableType } from "@/hooks/database/types/table";
import storage from "@/utils/storage";
import { DeviceEventEmitter } from "react-native";
import { API_LIST } from "../../API_LIST";
import { httpClient } from "../../client/httpClient";
import {
  getUnsyncedAdolescentIfaFromServer,
  sendUnsyncedAdolescentIfaToServer,
} from "./syncAdolescentIfa";
import {
  getUnsyncedMothersFromServer,
  sendUnsyncedMothersToServer,
} from "./syncMother";
import {
  getUnsyncedVisitsFromServer,
  sendUnsyncedVisitsToServer,
} from "./syncVisit";
import {
  getUnsyncedTodosFromServer,
  sendUnsyncedTodosToServer,
} from "./syncTodo";
import {
  getUnsyncedChildMonitoringFromServer,
  sendUnsyncedChildMonitoringToServer,
} from "./syncChildMonitoring";
import {
  getUnsyncedMothersGroupMeetingsFromServer,
  sendUnsyncedMothersGroupMeetingsToServer,
} from "./syncMothersGroupMeeting";
import {
  getUnsyncedMaternalDeathsFromServer,
  sendUnsyncedMaternalDeathsToServer,
} from "./syncMaternalDeath";
import {
  getUnsyncedNewbornDeathsFromServer,
  sendUnsyncedNewbornDeathsToServer,
} from "./syncNewbornDeath";
import {
  getUnsyncedPregnancyFromServer,
  sendUnsyncedPregnancyToServer,
} from "./syncPregnancy";
import {
  getUnsyncedSupplementsFromServer,
  sendUnsyncedSupplementsToServer,
} from "./syncSupplements";
import {
  getUnsyncedFamilyPlanningFromServer,
  sendUnsyncedFamilyPlanningToServer,
} from "./syncFamilyPlanning";
import {
  getUnsyncedCounselingReferralFromServer,
  sendUnsyncedCounselingReferralToServer,
} from "./syncCounselingReferral";
import {
  getUnsyncedChildCounselingFromServer,
  sendUnsyncedChildCounselingToServer,
} from "./syncChildCounseling";
import {
  getUnsyncedChildVaccinationFromServer,
  sendUnsyncedChildVaccinationToServer,
} from "./syncChildVaccination";
import {
  hasPendingDatabaseHydration,
  hydrateDatabaseFromServer,
} from "./hydrateDatabase";

const SYNCERS: Partial<
  Record<SyncTableType, (last_synced_at: string | null) => Promise<void>>
> = {
  mother: (last_synced_at: string | null) =>
    getUnsyncedMothersFromServer(last_synced_at),
  visit: (last_synced_at: string | null) =>
    getUnsyncedVisitsFromServer(last_synced_at),
  todo: (last_synced_at: string | null) =>
    getUnsyncedTodosFromServer(last_synced_at),
  pregnancy: (last_synced_at: string | null) =>
    getUnsyncedPregnancyFromServer(last_synced_at),
  adolescent_ifa: (last_synced_at: string | null) =>
    getUnsyncedAdolescentIfaFromServer(last_synced_at),
  child_monitoring: (last_synced_at: string | null) =>
    getUnsyncedChildMonitoringFromServer(last_synced_at),
  mothers_group_meetings: (last_synced_at: string | null) =>
    getUnsyncedMothersGroupMeetingsFromServer(last_synced_at),
  hmis_maternal_death: (last_synced_at: string | null) =>
    getUnsyncedMaternalDeathsFromServer(last_synced_at),
  hmis_newborn_death: (last_synced_at: string | null) =>
    getUnsyncedNewbornDeathsFromServer(last_synced_at),
  supplements: (last_synced_at: string | null) =>
    getUnsyncedSupplementsFromServer(last_synced_at),
  family_planning: (last_synced_at: string | null) =>
    getUnsyncedFamilyPlanningFromServer(last_synced_at),
  counseling_referral: (last_synced_at: string | null) =>
    getUnsyncedCounselingReferralFromServer(last_synced_at),
  child_counseling: (last_synced_at: string | null) =>
    getUnsyncedChildCounselingFromServer(last_synced_at),
  child_vaccination: (last_synced_at: string | null) =>
    getUnsyncedChildVaccinationFromServer(last_synced_at),
};

export let isGlobalSyncRunning = false;
let syncPromise: Promise<void> | null = null;

type SyncOptions = {
  sendOnly?: boolean;
  throwOnError?: boolean;
};

const normalizeSyncOptions = (
  options?: boolean | SyncOptions,
): SyncOptions => {
  if (typeof options === "boolean") {
    return { sendOnly: options };
  }

  return options ?? {};
};

const doSync = async (options?: boolean | SyncOptions) => {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = runSync(normalizeSyncOptions(options));

  try {
    await syncPromise;
  } finally {
    syncPromise = null;
  }
};

const runSync = async ({ sendOnly, throwOnError }: SyncOptions) => {
  await initDatabase();

  // Skip sync if user is not logged in
  const token = await storage.get(ACCESS_TOKEN_KEY);
  if (!token) return;

  isGlobalSyncRunning = true;
  DeviceEventEmitter.emit("sync.started");

  try {
    // Push local unsynced data to server
    await sendUnsyncedMothersToServer();
    await sendUnsyncedVisitsToServer();
    await sendUnsyncedTodosToServer();
    await sendUnsyncedPregnancyToServer();
    await sendUnsyncedAdolescentIfaToServer();
    await sendUnsyncedChildMonitoringToServer();
    await sendUnsyncedMothersGroupMeetingsToServer();
    await sendUnsyncedMaternalDeathsToServer();
    await sendUnsyncedNewbornDeathsToServer();
    await sendUnsyncedSupplementsToServer();
    await sendUnsyncedFamilyPlanningToServer();
    await sendUnsyncedCounselingReferralToServer();
    await sendUnsyncedChildCounselingToServer();
    await sendUnsyncedChildVaccinationToServer();

    if (await hasPendingDatabaseHydration()) {
      await hydrateDatabaseFromServer();
    }

    if (sendOnly) return;

    const timestamps = await getTablesWithTimestamp();
    const rawTables = (await fetchUnsyncedTablesFromServer(timestamps)) || [];

    for (const table of rawTables) {
      const tableName =
        table === "mothers_group_meeting"
          ? "mothers_group_meetings"
          : table === "maternal_death" || table === "maternal_deaths"
            ? "hmis_maternal_death"
            : table === "newborn_death" || table === "newborn_deaths"
              ? "hmis_newborn_death"
              : table === "supplement"
                ? "supplements"
                : table === "visits"
                  ? "visit"
                  : table === "todos"
                    ? "todo"
                    : table === "family-planning"
                      ? "family_planning"
                      : table === "counseling-referral" || table === "counseling_referrals"
                        ? "counseling_referral"
                        : table === "child-counseling" || table === "child_counselings"
                          ? "child_counseling"
                          : table === "child-vaccination" || table === "child_vaccinations"
                            ? "child_vaccination"
                            : table;
      const fn = SYNCERS[tableName as SyncTableType];
      if (!fn) continue;

      try {
        const last_synced_at = timestamps[tableName as TableType] ?? null;
        await fn(last_synced_at);
      } catch (e) {
        console.error(`[SYNC] fail  ${tableName}`, e);
      }
    }
  } catch (e) {
    console.error("[SYNC] error:", e);
    if (throwOnError) {
      throw e;
    }
  } finally {
    isGlobalSyncRunning = false;
    DeviceEventEmitter.emit("sync.completed");
  }
};

const fetchUnsyncedTablesFromServer = async (
  timestamps: Record<TableType, string | null>
) => {
  try {
    const response = await httpClient.post<string[]>(
      `${API_LIST.sync.unsynced_table_list}`,
      timestamps
    );
    return response.data;
  } catch (err) {
    console.error("Failed to fetch unsynced tables from server", err);
  }
};

export { doSync, fetchUnsyncedTablesFromServer };
