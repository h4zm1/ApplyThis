import type { AuthTokens } from "../types/auth";
import api from "./api";

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await api.post<AuthTokens>("/account/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function deleteAccount(password: string) {
  // seems like axios 2nd arg isn't data, so need to be specified to send data
  await api.delete("/account", { data: { password } });
}

export async function forgotPassword(email: string) {
  const response = await api.post<{ message: string }>(
    "/auth/forgot-password",
    { email },
  );
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  await api.post("/auth/reset-password", { token, newPassword });
}
