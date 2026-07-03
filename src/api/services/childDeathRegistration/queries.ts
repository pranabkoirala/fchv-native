import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { clearTable } from "@/hooks/database/models/CommonModal";
import {
  insertToTempChildDeathRegistrationTable,
  moveTempToRealChildDeathRegistrationTable,
} from "@/hooks/database/models/ChildDeathRegistrationModel";
import { PaginationType } from "../types/global_api";

const fetchFromServer = async (
  params: { sync_timestamp?: string | null } = {},
) => {
  let URL = `${API_LIST.child_death_registration.get}?page=1&page_size=200`;
  let isEOR = false;
  await clearTable("child_death_registration_staging");

  while (!isEOR) {
    const res = await httpClient.get<PaginationType<any> | any[]>(URL, {
      params: { ...params, include_deleted: true, page_size: 200 },
    });
    const payload = res.data;
    const results = Array.isArray(payload) ? payload : payload.results ?? [];
    if (!Array.isArray(payload)) {
      isEOR = payload.next === null;
      if (payload.next) { URL = payload.next; }
    } else {
      isEOR = true;
    }
    if (results.length) {
      await insertToTempChildDeathRegistrationTable(results);
    }
  }

  await moveTempToRealChildDeathRegistrationTable();
  await clearTable("child_death_registration_staging");
};

export { fetchFromServer };
