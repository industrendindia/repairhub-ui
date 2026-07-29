import { httpClient } from "@/lib/api/httpClient";
import type { AuthSession, LoginPayload } from "@/features/auth/types/auth.types";

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await httpClient.post<AuthSession>("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(): Promise<AuthSession["user"]> {
  const response = await httpClient.get<AuthSession["user"]>("/auth/me");
  return response.data;
}

export async function logout(): Promise<void> {
  await httpClient.post("/auth/logout");
}
