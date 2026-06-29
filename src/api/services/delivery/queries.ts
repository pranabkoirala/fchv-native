import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempDeliveryTable,
  moveTempToRealDeliveryTable,
} from "@/hooks/database/models/DeliveryModel";
import { PaginationType } from "../types/global_api";

// ─── Pull from server ─────────────────────────────────────────────────────────

/**
 * Fetches all delivery records from the server (supports incremental sync via
 * sync_timestamp) and writes them into the local database using the two-phase
 * staging approach:  staging → real table.
 *
 * Pagination is handled automatically; records arrive in pages of 200.
 */
export const fetchDeliveriesFromServer = async (
  params: { sync_timestamp?: string | null } = {},
): Promise<void> => {
  let url = `${API_LIST.delivery.get}?page=1&page_size=200`;
  let isEOR = false;

  // Clear staging table before loading fresh data from server
  await clearTable("delivery_staging");

  while (!isEOR) {
    const res = await httpClient.get<PaginationType<any> | any[]>(url, {
      params: { ...params, include_deleted: true, page_size: 200 },
    });

    const payload = res.data;
    const results: any[] = Array.isArray(payload)
      ? payload
      : payload.results ?? [];

    // Advance pagination cursor
    if (!Array.isArray(payload)) {
      isEOR = payload.next === null;
      if (payload.next) {
        url = payload.next;
      }
    } else {
      isEOR = true;
    }

    if (results.length) {
      await insertToTempDeliveryTable(results);
    }
  }

  // Merge staging → real table, then clean up staging
  await moveTempToRealDeliveryTable();
  await clearTable("delivery_staging");
};
