import { unSyncedChildMonitorings } from "@/hooks/database/models/InfantMonitoringModel";
import { postBulkChildMonitoring } from "../childMonitoring/mutation";
import { fetchChildMonitoringFromServer } from "../childMonitoring/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedChildMonitoringToServer() {
  await sendUnsyncedToServer(
    unSyncedChildMonitorings,
    postBulkChildMonitoring,
    "child_monitoring",
  );
}

export async function getUnsyncedChildMonitoringFromServer(
  last_synced_at: string | null,
) {
  await fetchChildMonitoringFromServer({
    sync_timestamp: last_synced_at,
  });
}
