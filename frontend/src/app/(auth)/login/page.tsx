"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser } from "@/store/slices/auth/auth.slice";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isLoggedIn, token } = useAppSelector((s) => s.auth);

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isLoggedIn && token) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = userName.trim();
    if (!u || !password) return;
    const result = await dispatch(loginUser({ userName: u, password }));
    if (loginUser.fulfilled.match(result)) {
      router.replace("/dashboard");
    }
  };

  const errMsg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message || "")
      : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your account to access the POS dashboard.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label htmlFor="login-userName" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-userName"
                  name="userName"
                  autoComplete="username"
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm",
                    "outline-none ring-blue-500/20 transition focus:border-blue-500 focus:bg-white focus:ring-4"
                  )}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. admin12"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm",
                    "outline-none ring-blue-500/20 transition focus:border-blue-500 focus:bg-white focus:ring-4"
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {errMsg ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {errMsg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !userName.trim() || !password}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white",
                "bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/25",
                "transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">Secure access to your point of sale.</p>
      </div>
    </div>
  );
}
