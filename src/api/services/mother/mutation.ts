import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import {
  CreateMotherPayload,
  MotherSyncPayload,
} from "@/hooks/database/types/motherModal";

const postBulkMother = async (data: CreateMotherPayload[]) => {
  const syncPayload: MotherSyncPayload[] = data.map((item) => ({
    id: item.id,
    first_name: item.first_name || "",
    last_name: item.last_name || "",
    phone_number: item.phone_number || "",
    date_of_birth: item.date_of_birth || "",
    gravida: item.gravida ?? null,
    parity: item.parity ?? null,
    address_locality: item.address_locality || null,
    address_house_number: item.address_house_number || null,
    address_province: item.address_province || "",
    address_district: item.address_district || "",
    address_municipality: item.address_municipality || "",
    address_ward: item.address_ward || "",
    income: item.income || null,
    education: item.education || null,
    occupation: item.occupation || null,
    jati_code: item.jati_code || null,
    blood_group: item.blood_group || null,
    photo: item.photo || null,
    emergency_contact_number: item.emergency_contact_number || null,
    partner_name: item.partner_name || null,
    partner_mobile: item.partner_mobile || null,
    partner_age: item.partner_age || null,
    updated_at: item.updated_at || new Date().toISOString(),
    deleted: false,
  }));
  // The fchv-sync endpoint expects an array of records
  const response = await httpClient.post<MotherSyncPayload[]>(
    API_LIST.mother.mother_sync,
    syncPayload,
  );

  return response.data;
};

export { postBulkMother };
