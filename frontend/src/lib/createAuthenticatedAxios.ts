import axios, { type AxiosInstance } from "axios";

/**
 * Axios for same-origin `/proxy/*` calls. Auth headers are omitted so create/list
 * calls are not blocked when the API does not require a token.
 */
export function createAuthenticatedAxios(_token?: string): AxiosInstance {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
    },
  });
}
