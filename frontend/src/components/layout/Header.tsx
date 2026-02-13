"use client";

// ============================================
// Header Component - Top Navigation Bar
// ============================================

import React from "react";
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setTheme } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div
          className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors md:flex ${
            searchFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
          }`}
        >
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-60 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 lg:inline">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Settings */}
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Settings className="h-[18px] w-[18px]" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-700">
                {user?.fullName || "Admin"}
              </p>
              <p className="text-[11px] text-gray-400">{user?.role || "Administrator"}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" /> Profile
              </a>
              <a
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" /> Settings
              </a>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => dispatch(logout())}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
