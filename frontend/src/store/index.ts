// ============================================
// Redux Store - Root Configuration
// ============================================

import { configureStore } from "@reduxjs/toolkit";
import persistedReducer from "./persistor";
import { setStoreGetter } from "@/config/api.config";

export const store = configureStore({
  reducer: persistedReducer,

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
    }),

  devTools: process.env.NODE_ENV !== "production",
});

setStoreGetter(() => store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
