// ============================================
// Redux Store - Root Configuration
// ============================================
// Combines RTK Query API (single base) with
// local state slices. Enables middleware,
// dev tools, and serializable check ignoring
// for API cache entries.
// ============================================

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import cartReducer from "./slices/cartSlice";

export const store = configureStore({
  reducer: {
    // RTK Query API reducer (handles all injected endpoint caches)
    [baseApi.reducerPath]: baseApi.reducer,

    // Local state slices
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
  },

  // RTK Query middleware for caching, polling, invalidation
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(baseApi.middleware),

  devTools: process.env.NODE_ENV !== "production",
});

// Enable refetchOnFocus / refetchOnReconnect
setupListeners(store.dispatch);

// Type exports
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
