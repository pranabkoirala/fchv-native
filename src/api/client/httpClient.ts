import axios, { type AxiosInstance, type AxiosError, isAxiosError } from "axios";
import { refreshToken } from "../services/auth/refreshToken";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/token";
import storage from "@/utils/storage";
import { router } from "expo-router";

const baseURL = process.env.EXPO_PUBLIC_API_URL;
const THREE_MINUTES = 3 * 60 * 1000;

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: THREE_MINUTES,
});

// ── Request interceptor: attach access token ──
httpClient.interceptors.request.use(async (config) => {
  const token = await storage.get(ACCESS_TOKEN_KEY);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor: auto-refresh on 401 ──
let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const logAxiosError = (error: unknown) => {
  if (!isAxiosError(error)) {
    console.log("[HTTP] Unknown error:", error);
    return;
  }

  const statusCode = error.response?.status;
  const apiUrl = error.config?.url;
  const method = error.config?.method?.toUpperCase();

  console.log(
    `[HTTP] ${method ?? "?"} ${apiUrl ?? "?"} → ${statusCode ?? "NO_STATUS"}: ${error.message}`
  );
};

const logout = async () => {
  await storage.remove(ACCESS_TOKEN_KEY);
  await storage.remove(REFRESH_TOKEN_KEY);
  // Navigate to login screen
  try {
    router.replace("/login");
  } catch {
    // router may not be ready during early app lifecycle – that's OK
  }
};

httpClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError & { config: any }) => {
    logAxiosError(error);
    const originalRequest = error.config;

    // Only attempt refresh on 401 and not on the token endpoints themselves
    const isTokenEndpoint =
      originalRequest?.url?.includes("/api/token/") ||
      originalRequest?.url?.includes("/api/token/refresh/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isTokenEndpoint
    ) {
      // If another request is already refreshing, queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return httpClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { access, refresh } = await refreshToken();

        await storage.set(ACCESS_TOKEN_KEY, access);
        await storage.set(REFRESH_TOKEN_KEY, refresh);

        httpClient.defaults.headers.common.Authorization = `Bearer ${access}`;
        processQueue(null, access);

        // Retry the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return httpClient(originalRequest);
      } catch (refreshErr) {
        const refreshError = refreshErr as AxiosError;
        processQueue(refreshError, null);

        // If refresh itself returns 401, the session is fully expired → logout
        if (refreshError?.response?.status === 401) {
          await logout();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
