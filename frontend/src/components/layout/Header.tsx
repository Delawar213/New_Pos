"use client";

// ============================================
// Header Component - Modern Top Navigation
// ============================================

import React from "react";
import {
  Menu,
  PanelLeftClose,
  // Bell,
  // Search,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  LogOut,
  User,
  // HelpCircle,
  // Command,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthState } from "@/store/slices/auth/auth.slice";
import { clearUserState } from "@/store/slices/user/user.slice";
import type { AuthUser } from "@/types/auth";

function isAuthUser(u: unknown): u is AuthUser {
  return (
    typeof u === "object" &&
    u != null &&
    "userName" in u &&
    typeof (u as AuthUser).userName === "string" &&
    "name" in u &&
    typeof (u as AuthUser).name === "string"
  );
}

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const { theme, user, toggleSidebar, toggleSidebarCollapse, sidebarCollapsed, toggleTheme, logout } =
    useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  // const [notificationsOpen, setNotificationsOpen] = useState(false);
  // const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // const notificationsRef = useRef<HTMLDivElement>(null);

  const profile =
    auth.isLoggedIn && isAuthUser(auth.user)
      ? {
          name: auth.user.name,
          email: auth.user.userName,
          role: auth.user.roleName,
          initial: (auth.user.name?.trim().charAt(0) || auth.user.userName?.trim().charAt(0) || "U").toUpperCase(),
        }
      : user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            initial: (user.name?.trim().charAt(0) || "A").toUpperCase(),
          }
        : null;

  const handleSignOut = () => {
    dispatch(clearAuthState());
    dispatch(clearUserState());
    logout();
    setProfileOpen(false);
    router.replace("/login");
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 dark:border-slate-700/80 dark:bg-slate-900/85 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => toggleSidebar()}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => toggleSidebarCollapse()}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:flex"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftClose
            className={cn("h-5 w-5 transition-transform duration-300", sidebarCollapsed && "rotate-180")}
          />
        </button>

        {/* Search — hidden for now */}
        {/* <div className={cn("hidden items-center gap-3 rounded-xl border px-4 py-2.5 md:flex", ...)}>
          ...
        </div> */}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Help — hidden for now */}
        {/* <button className="hidden h-10 w-10 ... sm:flex">
          <HelpCircle className="h-5 w-5" />
        </button> */}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Dark mode" : "Light mode"}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications — hidden for now */}
        {/* <div className="relative" ref={notificationsRef}>...</div> */}

        {/* Settings icon — hidden for now (settings still in profile menu) */}
        {/* <button className="hidden h-10 w-10 ... sm:flex">
          <Settings className="h-5 w-5" />
        </button> */}

        {/* Divider */}
        <div className="mx-2 h-8 w-px bg-slate-200" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
          >
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                {profile?.initial ?? "?"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-700">
                {profile?.name || "User"}
              </p>
              <p className="text-[11px] text-slate-400">{profile?.role || "—"}</p>
            </div>
            <ChevronDown className={cn(
              "hidden h-4 w-4 text-slate-400 transition-transform duration-200 md:block",
              profileOpen && "rotate-180"
            )} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-200/50 animate-slideDown dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{profile?.name || "User"}</p>
                <p className="text-xs text-slate-500">{profile?.email || "—"}</p>
              </div>
              
              <div className="py-1">
                <a
                  href="/settings/company"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="font-medium">Company profile</span>
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Settings className="h-4 w-4" />
                  </span>
                  <span className="font-medium">Settings</span>
                </a>
              </div>
              
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => handleSignOut()}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
