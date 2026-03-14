"use client";

// ============================================
// Providers - Client Component Wrapper
// ============================================

import { StoreProvider } from "@/store/provider";
import { AppProvider } from "@/contexts/AppContext";
import { ToastContainer } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppProvider>
        {children}
        <ToastContainer />
      </AppProvider>
    </StoreProvider>
  );
}
