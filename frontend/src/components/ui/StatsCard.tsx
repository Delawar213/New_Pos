"use client";

// ============================================
// Stats Card Component
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
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "indigo";
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-yellow-50 text-yellow-600",
  purple: "bg-purple-50 text-purple-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = "blue",
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2.5", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-gray-400">
            {changeLabel || "vs last month"}
          </span>
        </div>
      )}
    </div>
  );
}
