import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { CreateMotherPayload, MotherSyncPayload } from "@/hooks/database/types/motherModal";

const postMother = async (data: CreateMotherPayload) => {
  // Map local payload to the specific nested format expected by the sync API
  // We use || null to ensure keys are present in JSON (Axios strips undefined keys)
  const syncPayload: MotherSyncPayload = {
    id: data.id,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    alias: data.alias || null,
    phone_number: data.phone_number || "",
    date_of_birth: data.date_of_birth || "",
    gravida: data.gravida ?? null,
    parity: data.parity ?? null,
    address: {
      locality: data.address_locality || null,
      house_number: data.address_house_number || null,
      province: data.address_province || "",
      district: data.address_district || "",
      municipality: data.address_municipality || "",
      ward: data.address_ward || ""
    },
    income: data.income || null,
    education: data.education || null,
    occupation: data.occupation || null,
    jati_code: data.jati_code || null,
    blood_group: data.blood_group || null,
    emergency_contact_number: data.emergency_contact_number || null,
    partner_name: data.partner_name || null,
    partner_mobile: data.partner_mobile || null,
    partner_age: data.partner_age || null,
    updated_at: data.updated_at || new Date().toISOString(),
    deleted: false
  };

  // The fchv-sync endpoint expects an array of records
  const response = await httpClient.post<MotherSyncPayload[]>(
    API_LIST.mother.mother_sync,
    [syncPayload]
  );

  // Server returns an array — return the first item so callers still get a single object
  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

export { postMother };
