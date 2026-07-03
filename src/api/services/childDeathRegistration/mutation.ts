import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { ChildDeathRegistrationStoreType } from "@/hooks/database/types/childDeathRegistration";

const mapToSyncPayload = (data: ChildDeathRegistrationStoreType) => ({
  id: data.id,
  child: data.child,
  death_status: data.death_status,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulk = async (data: ChildDeathRegistrationStoreType[]) => {
  const response = await httpClient.post<ChildDeathRegistrationStoreType[]>(
    API_LIST.child_death_registration.post,
    data.map(mapToSyncPayload),
  );
  return response.data;
};

export { postBulk };
