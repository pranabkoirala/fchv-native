import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempNewbornDeathTable,
  moveTempToRealNewbornDeathTable,
} from "@/hooks/database/models/NewbornDeathModel";
import { PaginationType } from "../types/global_api";

const fetchNewbornDeathsFromServer = async (
  params: { sync_timestamp?: string | null } = {},
) => {
  let URL = `${API_LIST.newBorn_death.get}?page=1&page_size=200`;
  let isEOR = false;

  await clearTable("hmis_newborn_death_staging");

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
      await insertToTempNewbornDeathTable(results);
    }
  }

  await moveTempToRealNewbornDeathTable();
  await clearTable("hmis_newborn_death_staging");
};

export { fetchNewbornDeathsFromServer };
