import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempPncVisitTable,
  moveTempToRealPncVisitTable,
} from "@/hooks/database/models/PncVisitModel";
import { PaginationType } from "../types/global_api";

const fetchPncVisitsFromServer = async (
  params: { sync_timestamp?: string | null } = {},
) => {
  let URL = `${API_LIST.pnc_visits.get}?page=1&page_size=200`;
  let isEOR = false;

  await clearTable("pnc_visit_staging");

  while (!isEOR) {
    const res = await httpClient.get<PaginationType<any> | any[]>(URL, {
      params: { ...params, include_deleted: true, page_size: 200 },
    });

    const payload = res.data;
    const results = Array.isArray(payload)
      ? payload
      : payload.results ?? [];

    if (!Array.isArray(payload)) {
      isEOR = payload.next === null;
      if (payload.next) {
        URL = payload.next;
      }
    } else {
      isEOR = true;
    }

    if (results.length) {
      await insertToTempPncVisitTable(results);
    }
  }

  await moveTempToRealPncVisitTable();
  await clearTable("pnc_visit_staging");
};

export { fetchPncVisitsFromServer };
