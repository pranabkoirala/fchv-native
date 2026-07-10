import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { ChildBirthRegistrationStoreType } from "@/hooks/database/types/childBirthRegistration";

const mapToSyncPayload = (data: ChildBirthRegistrationStoreType) => ({
  id: data.id,
  child: data.child,
  birth_status: data.birth_status,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postBulk = async (data: ChildBirthRegistrationStoreType[]) => {
  const response = await httpClient.post<ChildBirthRegistrationStoreType[]>(
    API_LIST.child_birth_registration.post,
    data.map(mapToSyncPayload),
  );
  return response.data;
};

export { postBulk };
