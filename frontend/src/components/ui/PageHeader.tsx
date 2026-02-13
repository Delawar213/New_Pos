"use client";

// ============================================
// Page Header Component - Modern Design
// ============================================

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "rose";
}

const badgeColors = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  badgeColor = "blue",
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm">
          <Link 
            href="/dashboard" 
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="rounded-md px-2 py-1 font-medium text-slate-700 bg-slate-100">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            {badge && (
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                badgeColors[badgeColor]
              )}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-500 max-w-2xl">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
