import axios from "axios";
import { API_LIST } from "../../API_LIST";
import { REFRESH_TOKEN_KEY } from "@/constants/token";
import storage from "@/utils/storage";
import { TokenStructure } from "../types/token";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export const refreshToken = async () => {
  const response = await axios.post<TokenStructure>(
    `${baseURL}${API_LIST.mother.refresh}`,
    {
      refresh: await storage.get(REFRESH_TOKEN_KEY)
    }
  );
  return response.data;
};
