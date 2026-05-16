"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

/**
 * Protects dashboard routes: redirects to `/login` when there is no session.
 * Renders after Redux Persist has rehydrated (child of `PersistGate`).
 */
export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      router.replace("/login");
    }
  }, [isLoggedIn, token, router]);

  if (!isLoggedIn || !token) {
    return (
      <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm font-medium">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
