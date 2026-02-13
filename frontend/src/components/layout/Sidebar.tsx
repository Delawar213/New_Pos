"use client";

// ============================================
// Sidebar Component - Modern POS Navigation
// ============================================

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, X, Sparkles } from "lucide-react";
import { sidebarNavigation } from "@/config/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebarCollapse, setSidebarOpen } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarOpen, sidebarCollapsed } = useAppSelector((s) => s.ui);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-white transition-all duration-300 ease-out lg:relative lg:z-auto",
          "border-r border-slate-200/80 shadow-xl shadow-slate-200/50 lg:shadow-none",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className={cn(
              "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300",
              sidebarCollapsed ? "h-10 w-10" : "h-10 w-10"
            )}>
              <Sparkles className="h-5 w-5" />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-30 blur-sm -z-10" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fadeIn">
                <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  FlexPOS
                </span>
                <p className="text-[10px] font-medium text-slate-400 -mt-0.5">Business Suite</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {sidebarNavigation.map((group, groupIndex) => (
            <div key={group.title} className={cn("mb-6", groupIndex > 0 && "pt-2")}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const active = isActive(item.href);
                  const expanded = expandedMenus.includes(item.label);

                  return (
                    <div key={item.label}>
                      {hasChildren ? (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500" />
                          )}
                          <span className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                            active 
                              ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20" 
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                          )}>
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                                  expanded && "rotate-180"
                                )}
                              />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500" />
                          )}
                          <span className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                            active 
                              ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20" 
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                          )}>
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          {!sidebarCollapsed && (
                            <>
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-rose-500/25">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      )}

                      {/* Children */}
                      {hasChildren && expanded && !sidebarCollapsed && (
                        <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-4 animate-slideDown">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-[13px] transition-all duration-200",
                                isActive(child.href)
                                  ? "font-semibold text-blue-600 bg-blue-50/50"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card & collapse toggle */}
        <div className="border-t border-slate-100 p-3">
          {/* Upgrade card - only when expanded */}
          {!sidebarCollapsed && (
            <div className="mb-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">PRO</span>
              </div>
              <p className="text-sm font-medium">Upgrade to Pro</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Unlock advanced features</p>
              <button className="mt-3 w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors">
                Learn More
              </button>
            </div>
          )}

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => dispatch(toggleSidebarCollapse())}
            className={cn(
              "hidden w-full items-center justify-center rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 lg:flex",
              sidebarCollapsed && "mx-auto"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
