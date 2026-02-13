"use client";

// ============================================
// Sidebar Component - POS Navigation
// ============================================

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, X } from "lucide-react";
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:relative lg:z-auto",
          sidebarCollapsed ? "w-[68px]" : "w-[250px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                P
              </div>
              <span className="text-lg font-bold text-gray-900">POS</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              P
            </div>
          )}
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="rounded-md p-1 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {sidebarNavigation.map((group) => (
            <div key={group.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {group.title}
                </p>
              )}
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
                          "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
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
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                        {item.badge && !sidebarCollapsed && (
                          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Children */}
                    {hasChildren && expanded && !sidebarCollapsed && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                              isActive(child.href)
                                ? "font-medium text-blue-700"
                                : "text-gray-500 hover:text-gray-900"
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
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden border-t border-gray-200 p-2 lg:block">
          <button
            onClick={() => dispatch(toggleSidebarCollapse())}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
