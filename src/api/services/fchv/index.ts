import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { STAFF_ID_KEY } from "@/constants/token";
import storage from "@/utils/storage";
import { saveLocalFchvProfile, getLocalFchvProfile } from "@/hooks/database/models/FchvProfileModel";
import NetInfo from "@react-native-community/netinfo";

export const getFchvData = async () => {
    const id = await storage.get(STAFF_ID_KEY)
    if (!id) {
        throw new Error("FCHV ID not found");
    }

    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
        try {
            const response = await httpClient.get<any>(API_LIST.fchv_data.get.replace("{id}", id as string));
            if (response.data) {
                await saveLocalFchvProfile(response.data);
                return response.data;
            }
        } catch (error) {
            console.log("Error fetching online FCHV data, falling back to local DB:", error);
        }
    }

    // Fallback to local database
    const localData = await getLocalFchvProfile();
    return localData || undefined;
}