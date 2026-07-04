import axios, { AxiosError } from "axios";
import { env } from "@/config/env";
import { authTokenStore } from "@/features/auth/api/authTokenStore";
import type { ApiError } from "@/lib/api/api.types";

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

httpClient.interceptors.request.use((config) => {
  const token = authTokenStore.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const normalizedError: ApiError = {
      message: error.response?.data?.message || error.message || "Request failed",
      status: error.response?.status,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };

    return Promise.reject(normalizedError);
  }
);
