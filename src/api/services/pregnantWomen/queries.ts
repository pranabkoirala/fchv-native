
// import { insertToTempPregnancyTable, moveTempToRealPregnancyTable } from "@/hooks/database/models/PregnantWomenModal";
// import { API_LIST } from "../../API_LIST";
// import { httpClient } from "../../client/httpClient";
// import { PaginationType } from "../types/global_api";
// import { PregnancyAPIParams, PregnancyAPIResponse } from "../types/pregnancy";
// import { clearTable } from "@/hooks/database/models/CommonModal";

// const fetchPregnancyFromServer = async (params: PregnancyAPIParams) => {
//   let URL = `${API_LIST.pregnancies.post}?page=1&page_size=200`;
//   let isEOR = false; // end of response

//   await clearTable("pregnancy_staging");
//   while (!isEOR) {
//     const res = await httpClient.get<PaginationType<PregnancyAPIResponse>>(URL, {
//       params: { ...params, include_deleted: true, page_size: 200 }
//     });
//     const response = res.data;
//     if (response.next === null) {
//       isEOR = true;
//     } else {
//       URL = response.next;
//     }

//     // INSERTION
//     await insertToTempPregnancyTable(response.results);
//   }

//   await moveTempToRealPregnancyTable();
//   await clearTable("pregnancy_staging");
// };

// export { fetchPregnancyFromServer };
