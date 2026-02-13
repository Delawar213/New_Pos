"use client";

// ============================================
// Stats Card Component - Modern Design
// ============================================

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "cyan" | "rose" | "indigo";
  variant?: "default" | "gradient" | "outline";
}

const colorStyles = {
  blue: {
    icon: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
    ring: "ring-blue-500/20",
  },
  green: {
    icon: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    gradient: "from-emerald-500 to-emerald-600",
    ring: "ring-emerald-500/20",
  },
  red: {
    icon: "bg-rose-500",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    gradient: "from-rose-500 to-rose-600",
    ring: "ring-rose-500/20",
  },
  amber: {
    icon: "bg-amber-500",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    gradient: "from-amber-500 to-amber-600",
    ring: "ring-amber-500/20",
  },
  purple: {
    icon: "bg-violet-500",
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    gradient: "from-violet-500 to-violet-600",
    ring: "ring-violet-500/20",
  },
  cyan: {
    icon: "bg-cyan-500",
    iconBg: "bg-cyan-50",
    iconText: "text-cyan-600",
    gradient: "from-cyan-500 to-cyan-600",
    ring: "ring-cyan-500/20",
  },
  rose: {
    icon: "bg-pink-500",
    iconBg: "bg-pink-50",
    iconText: "text-pink-600",
    gradient: "from-pink-500 to-pink-600",
    ring: "ring-pink-500/20",
  },
  indigo: {
    icon: "bg-indigo-500",
    iconBg: "bg-indigo-50",
    iconText: "text-indigo-600",
    gradient: "from-indigo-500 to-indigo-600",
    ring: "ring-indigo-500/20",
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = "blue",
  variant = "default",
}: StatsCardProps) {
  const styles = colorStyles[color];

  if (variant === "gradient") {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
        styles.gradient
      )}>
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-white/10" />
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{title}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
          {change !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                change >= 0 ? "bg-white/20 text-white" : "bg-white/20 text-white"
              )}>
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
              <span className="text-xs text-white/70">
                {changeLabel || "vs last month"}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:shadow-lg",
      variant === "outline" 
        ? `border-2 border-dashed hover:border-solid ${styles.ring} ring-2 ring-offset-2`
        : "border-slate-200/80 hover:border-slate-300"
    )}>
      {/* Subtle background gradient on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        "bg-gradient-to-br from-slate-50 to-transparent"
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            styles.iconBg
          )}>
            <Icon className={cn("h-6 w-6", styles.iconText)} />
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              change >= 0 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-rose-50 text-rose-700"
            )}>
              {change >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-xs text-slate-400">
              {changeLabel || "vs last month"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
