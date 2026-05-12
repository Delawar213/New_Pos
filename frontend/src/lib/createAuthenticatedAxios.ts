import axios, { type AxiosInstance } from "axios";

/**
 * Axios for same-origin `/proxy/*` calls (no auth headers).
 */
export function createAuthenticatedAxios(): AxiosInstance {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
    },
  });
}
