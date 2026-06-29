import { unSyncedDeliveries } from "@/hooks/database/models/DeliveryModel";
import { postBulkDeliveries } from "../delivery/mutation";
import { fetchDeliveriesFromServer } from "../delivery/queries";
import { sendUnsyncedToServer } from "./helper";

// ─── Push: local → server ─────────────────────────────────────────────────────

/**
 * Finds all local delivery records with is_synced = 0, posts them to the
 * server in bulk, and marks each confirmed record as is_synced = 1.
 */
export async function sendUnsyncedDeliveriesToServer(): Promise<void> {
  await sendUnsyncedToServer(
    unSyncedDeliveries,
    postBulkDeliveries,
    "delivery",
  );
}

// ─── Pull: server → local ────────────────────────────────────────────────────

/**
 * Fetches delivery records from the server that changed after last_synced_at
 * and merges them into the local database.
 */
export async function getUnsyncedDeliveriesFromServer(
  last_synced_at: string | null,
): Promise<void> {
  await fetchDeliveriesFromServer({ sync_timestamp: last_synced_at });
}
