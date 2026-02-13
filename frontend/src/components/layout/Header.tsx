"use client";

// ============================================
// Header Component - Modern Top Navigation
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
  HelpCircle,
  Command,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setTheme } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Sample notifications
  const notifications = [
    { id: 1, title: "New order received", message: "Order #1234 from Ahmed Hassan", time: "2m ago", unread: true },
    { id: 2, title: "Low stock alert", message: "Premium Wall Paint is running low", time: "1h ago", unread: true },
    { id: 3, title: "Payment received", message: "AED 450.00 from walk-in customer", time: "3h ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div
          className={cn(
            "hidden items-center gap-3 rounded-xl border px-4 py-2.5 transition-all duration-200 md:flex",
            searchFocused 
              ? "w-96 border-blue-500 bg-white shadow-lg shadow-blue-500/10" 
              : "w-72 border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
          )}
        >
          <Search className={cn(
            "h-4 w-4 transition-colors",
            searchFocused ? "text-blue-500" : "text-slate-400"
          )} />
          <input
            type="text"
            placeholder="Search anything..."
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className={cn(
            "hidden items-center gap-0.5 rounded-lg border px-2 py-1 text-[10px] font-medium lg:flex transition-colors",
            searchFocused 
              ? "border-blue-200 bg-blue-50 text-blue-600" 
              : "border-slate-200 bg-white text-slate-400"
          )}>
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Help button */}
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors sm:flex">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-200/50 animate-slideDown">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex gap-3",
                      notification.unread && "bg-blue-50/50"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      notification.unread 
                        ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white" 
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        notification.unread ? "font-semibold text-slate-800" : "font-medium text-slate-600"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{notification.time}</p>
                    </div>
                    {notification.unread && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 px-4 py-2">
                <button className="w-full rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors sm:flex">
          <Settings className="h-5 w-5" />
        </button>

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
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-700">
                {user?.fullName || "Admin User"}
              </p>
              <p className="text-[11px] text-slate-400">{user?.role || "Administrator"}</p>
            </div>
            <ChevronDown className={cn(
              "hidden h-4 w-4 text-slate-400 transition-transform duration-200 md:block",
              profileOpen && "rotate-180"
            )} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-200/50 animate-slideDown">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{user?.fullName || "Admin User"}</p>
                <p className="text-xs text-slate-500">{user?.email || "admin@flexpro.com"}</p>
              </div>
              
              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="font-medium">My Profile</span>
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
                  onClick={() => dispatch(logout())}
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
