"use client";

// ============================================
// Status Badge Component
// ============================================

import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "dot" | "pill";
}

const statusColors: Record<string, string> = {
  // Generic
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  // Sales
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-purple-100 text-purple-700",
  // Purchases
  received: "bg-green-100 text-green-700",
  partial: "bg-blue-100 text-blue-700",
  // Transactions
  income: "bg-green-100 text-green-700",
  expense: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
};

const dotColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  returned: "bg-purple-500",
  received: "bg-green-500",
  partial: "bg-blue-500",
  income: "bg-green-500",
  expense: "bg-red-500",
  transfer: "bg-blue-500",
};

export default function StatusBadge({ status, variant = "pill" }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  if (variant === "dot") {
    return (
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", dotColors[normalized] || "bg-gray-400")} />
        <span className="text-sm capitalize text-gray-700">{status}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        statusColors[normalized] || "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}
