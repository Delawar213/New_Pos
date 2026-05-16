/**
 * Holds the latest access token for same-origin `/proxy/*` axios calls.
 * Updated from the Redux store in `StoreProvider` so `createAuthenticatedAxios()`
 * can attach `Authorization` without circular imports.
 */
let authAccessToken: string | null = null;

export function setClientAccessToken(token: string | null): void {
  authAccessToken = token?.trim() ? token.trim() : null;
}

export function getClientAccessToken(): string | null {
  return authAccessToken;
}
