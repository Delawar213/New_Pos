"use client";

// ============================================
// Sidebar Component - Modern POS Navigation
// ============================================

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, X, Sparkles } from "lucide-react";
import { sidebarNavigation, type NavGroup, type NavItem } from "@/config/navigation";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

function itemOrChildActive(item: NavItem, isActive: (href: string) => boolean): boolean {
  if (isActive(item.href)) return true;
  return item.children?.some((c) => isActive(c.href)) ?? false;
}

function groupIsActive(group: NavGroup, isActive: (href: string) => boolean): boolean {
  return group.items.some((item) => itemOrChildActive(item, isActive));
}

function findActiveMenuInGroup(
  group: NavGroup,
  isActive: (href: string) => boolean
): string | null {
  for (const item of group.items) {
    if (item.children?.length && item.children.some((c) => isActive(c.href))) {
      return item.label;
    }
  }
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapse } = useApp();
  /** Only one section (e.g. Finance, Customers) open at a time. */
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  /** Only one submenu (e.g. Sales vs Purchases) open at a time within a section. */
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/reports") {
        return pathname === "/reports" || pathname.startsWith("/reports/");
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  useEffect(() => {
    for (const group of sidebarNavigation) {
      if (!groupIsActive(group, isActive)) continue;
      setExpandedGroup(group.title);
      setExpandedMenu(findActiveMenuInGroup(group, isActive));
      return;
    }
  }, [pathname, isActive]);

  const toggleGroup = (title: string) => {
    setExpandedGroup((prev) => {
      if (prev === title) return null;
      return title;
    });
    setExpandedMenu(null);
  };

  const toggleMenu = (label: string, groupTitle: string) => {
    setExpandedGroup(groupTitle);
    setExpandedMenu((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-white transition-all duration-300 ease-out lg:relative lg:z-auto",
          "border-r border-slate-200/80 shadow-xl shadow-slate-200/50 lg:shadow-none",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-100 px-4",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}
          >
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300"
              )}
            >
              <Sparkles className="h-5 w-5" />
              <div className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-30 blur-sm" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fadeIn">
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-lg font-bold text-transparent">
                  FlexPOS
                </span>
                <p className="-mt-0.5 text-[10px] font-medium text-slate-400">Business Suite</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {sidebarNavigation.map((group, groupIndex) => {
            const groupExpanded = expandedGroup === group.title;
            const groupActive = groupIsActive(group, isActive);

            return (
              <div key={group.title} className={cn("mb-2", groupIndex > 0 && "pt-1")}>
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors",
                      groupExpanded || groupActive
                        ? "bg-slate-100 text-slate-700"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                    aria-expanded={groupExpanded}
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        groupExpanded && "rotate-180"
                      )}
                    />
                  </button>
                ) : null}

                {(sidebarCollapsed || groupExpanded) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const hasChildren = Boolean(item.children?.length);
                      const active = itemOrChildActive(item, isActive);
                      const menuExpanded = expandedMenu === item.label;

                      return (
                        <div key={item.label}>
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleMenu(item.label, group.title)}
                              className={cn(
                                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                sidebarCollapsed && "justify-center px-2",
                                active
                                  ? "bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              )}
                              title={sidebarCollapsed ? item.label : undefined}
                            >
                              {active && (
                                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500" />
                              )}
                              <span
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                  active
                                    ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                                )}
                              >
                                <Icon className="h-[18px] w-[18px]" />
                              </span>
                              {!sidebarCollapsed && (
                                <>
                                  <span className="flex-1 text-left">{item.label}</span>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 text-slate-400 transition-transform duration-200",
                                      menuExpanded && "rotate-180"
                                    )}
                                  />
                                </>
                              )}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                sidebarCollapsed && "justify-center px-2",
                                isActive(item.href)
                                  ? "bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              )}
                              title={sidebarCollapsed ? item.label : undefined}
                            >
                              {isActive(item.href) && (
                                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500" />
                              )}
                              <span
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                  isActive(item.href)
                                    ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                                )}
                              >
                                <Icon className="h-[18px] w-[18px]" />
                              </span>
                              {!sidebarCollapsed && (
                                <>
                                  <span>{item.label}</span>
                                  {item.badge ? (
                                    <span className="ml-auto rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-rose-500/25">
                                      {item.badge}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Link>
                          )}

                          {hasChildren && menuExpanded && !sidebarCollapsed && (
                            <div className="animate-slideDown ml-5 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-4">
                              {item.children!.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={cn(
                                    "block rounded-lg px-3 py-2 text-[13px] transition-all duration-200",
                                    isActive(child.href)
                                      ? "bg-blue-50/50 font-semibold text-blue-600"
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
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => toggleSidebarCollapse()}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden w-full items-center justify-center gap-2 rounded-xl p-2.5 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 lg:flex",
              sidebarCollapsed && "mx-auto"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                sidebarCollapsed && "rotate-180"
              )}
            />
            {!sidebarCollapsed && <span className="text-xs font-semibold">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
