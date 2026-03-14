// ============================================
// Redux Store - Root Configuration
// ============================================

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import persistedReducer from "./persistor";
import { setStoreGetter } from "@/config/api.config";

export const store = configureStore({
  reducer: persistedReducer,

  // RTK Query middleware for caching, polling, invalidation
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/FLUSH",
          "persist/PAUSE",
          "persist/PURGE",
        ],
      },
    }).concat(baseApi.middleware),

  devTools: process.env.NODE_ENV !== "production",
});

// Register the store with API config to avoid circular dependency
setStoreGetter(() => store);

// Enable refetchOnFocus / refetchOnReconnect
setupListeners(store.dispatch);

// Type exports
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
