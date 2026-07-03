import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempAbortionTable,
  moveTempToRealAbortionTable,
} from "@/hooks/database/models/AbortionModel";
import { PaginationType } from "../types/global_api";

const fetchAbortionsFromServer = async (
  params: { sync_timestamp?: string | null } = {},
) => {
  let URL = `${API_LIST.abortion.get}?page=1&page_size=200`;
  let isEOR = false;

  await clearTable("abortion_staging");

  while (!isEOR) {
    const res = await httpClient.get<PaginationType<any> | any[]>(URL, {
      params: { ...params, include_deleted: true, page_size: 200 },
    });

    const payload = res.data;
    const results = Array.isArray(payload) ? payload : payload.results ?? [];

    if (!Array.isArray(payload)) {
      isEOR = payload.next === null;
      if (payload.next) {
        URL = payload.next;
      }
    } else {
      isEOR = true;
    }

    if (results.length) {
      await insertToTempAbortionTable(results);
    }
  }

  await moveTempToRealAbortionTable();
  await clearTable("abortion_staging");
};

export { fetchAbortionsFromServer };
