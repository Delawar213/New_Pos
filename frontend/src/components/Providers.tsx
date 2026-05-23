"use client";

// ============================================
// Providers - Client Component Wrapper
// ============================================

import { StoreProvider } from "@/store/provider";
import { AppProvider } from "@/contexts/AppContext";
import { ToastContainer } from "@/components/ui";
import { QzTrayLoader } from "@/components/pos/QzTrayLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppProvider>
        <QzTrayLoader />
        {children}
        <ToastContainer />
      </AppProvider>
    </StoreProvider>
  );
}
