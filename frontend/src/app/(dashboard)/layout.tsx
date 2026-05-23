"use client";

// ============================================
// Dashboard Layout - Modern Sidebar + Header
// ============================================

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { cn } from "@/lib/utils";
import { DashboardAuthGate } from "@/components/auth/DashboardAuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPosRoute = pathname === "/pos";

  return (
    <DashboardAuthGate>
      <div className="flex h-screen overflow-hidden bg-mesh text-slate-900 dark:text-slate-100">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main
            className={cn(
              "flex-1 min-h-0 transition-all duration-300 scrollbar-thin",
              isPosRoute ? "overflow-hidden p-0" : "overflow-y-auto p-6"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardAuthGate>
  );
}
