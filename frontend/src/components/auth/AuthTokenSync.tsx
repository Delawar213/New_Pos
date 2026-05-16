"use client";

import { useEffect } from "react";
import { store } from "@/store";
import { setClientAccessToken } from "@/lib/authTokenHolder";

/** Keeps `createAuthenticatedAxios()` in sync with the persisted auth token. */
export function AuthTokenSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sync = () => {
      const t = store.getState().auth.token;
      setClientAccessToken(t && String(t).trim() ? String(t) : null);
    };
    sync();
    return store.subscribe(sync);
  }, []);
  return <>{children}</>;
}
