import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { CreatePregnancyPayload, PregnancySyncPayload } from "@/hooks/database/types/pregnancyModal";

const postPregnancy = async (data: CreatePregnancyPayload) => {
  // Map local payload to the specific format expected by the sync API
  const syncPayload: PregnancySyncPayload = {
    id: data.id,
    name: data.name || "Unknown",
    lmp_date: data.lmp_date,
    caretakers_name: data.caretakers_name || "",
    caretakers_phone: data.caretakers_phone || "",
    mother: data.mother_id, // Map mother_id to "mother"
    expected_delivery_date: data.expected_delivery_date || "",
    is_current: !!data.is_current,
    parity: data.parity || 0,
    selected: !!data.selected,
    ended: !!data.ended,
    delivered: !!data.delivered,
    risk_level: data.risk_level || "normal"
  };

  // The fchv-sync endpoint expects an array of records
  const response = await httpClient.post<PregnancySyncPayload[]>(
    API_LIST.pregnancies.post,
    syncPayload
  );
  
  // Server returns an array — return the first item so callers still get a single object
  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

export { postPregnancy };
