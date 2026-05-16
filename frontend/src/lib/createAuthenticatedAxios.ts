import axios, { type AxiosInstance } from "axios";
import { getClientAccessToken } from "@/lib/authTokenHolder";

/**
 * Axios for same-origin `/proxy/*` calls.
 * Sends `Authorization: Bearer <token>` when a token was set via the Redux store sync in `StoreProvider`.
 */
export function createAuthenticatedAxios(): AxiosInstance {
  const token = getClientAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return axios.create({ headers });
}
