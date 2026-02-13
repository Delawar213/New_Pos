"use client";

// ============================================
// Dashboard Layout - Sidebar + Header wrapper
// ============================================
// This layout wraps all authenticated pages
// inside the dashboard group.
// ============================================

import React from "react";
import { Sidebar, Header } from "@/components/layout";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 lg:p-6",
            "transition-all duration-300"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
