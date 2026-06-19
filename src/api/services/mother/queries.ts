import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempMotherTable,
  moveTempToRealMotherTable,
} from "@/hooks/database/models/MotherModel";
import { API_LIST } from "../../API_LIST";
import { httpClient } from "../../client/httpClient";
import { PaginationType } from "../types/global_api";

export async function fetchMothersFromServer(
  params: { sync_timestamp?: string | null } = {},
) {
  let URL = `${API_LIST.mother.fetch}?page=1&page_size=200`;
  let isEOR = false;

  await clearTable("mother_staging");

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
      await insertToTempMotherTable(results);
    }
  }

  await moveTempToRealMotherTable();
  await clearTable("mother_staging");
}
