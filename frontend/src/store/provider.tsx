"use client";

// ============================================
// Redux Provider - Client Component Wrapper
// ============================================

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { store } from "./index";
import { AuthTokenSync } from "@/components/auth/AuthTokenSync";

const persistor = persistStore(store);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthTokenSync>{children}</AuthTokenSync>
      </PersistGate>
    </Provider>
  );
}
