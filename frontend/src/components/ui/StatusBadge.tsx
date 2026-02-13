"use client";

// ============================================
// Status Badge Component - Modern Design
// ============================================

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, X, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  variant?: "dot" | "pill" | "outline" | "soft";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<string, { 
  bg: string; 
  text: string; 
  border: string;
  dot: string;
  icon: React.ElementType;
}> = {
  // Generic
  active: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: Check 
  },
  inactive: { 
    bg: "bg-slate-100", 
    text: "text-slate-600", 
    border: "border-slate-200",
    dot: "bg-slate-400",
    icon: X 
  },
  // Sales/Orders
  completed: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: Check 
  },
  pending: { 
    bg: "bg-amber-100", 
    text: "text-amber-700", 
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock 
  },
  processing: { 
    bg: "bg-blue-100", 
    text: "text-blue-700", 
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: Loader2 
  },
  cancelled: { 
    bg: "bg-rose-100", 
    text: "text-rose-700", 
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: X 
  },
  returned: { 
    bg: "bg-violet-100", 
    text: "text-violet-700", 
    border: "border-violet-200",
    dot: "bg-violet-500",
    icon: ArrowLeft 
  },
  // Purchases
  received: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: Check 
  },
  partial: { 
    bg: "bg-cyan-100", 
    text: "text-cyan-700", 
    border: "border-cyan-200",
    dot: "bg-cyan-500",
    icon: Clock 
  },
  // Transactions
  income: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: Check 
  },
  expense: { 
    bg: "bg-rose-100", 
    text: "text-rose-700", 
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: AlertCircle 
  },
  transfer: { 
    bg: "bg-blue-100", 
    text: "text-blue-700", 
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: ArrowLeft 
  },
  // Stock
  "in stock": { 
    bg: "bg-emerald-100", 
    text: "text-emerald-700", 
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: Check 
  },
  "low stock": { 
    bg: "bg-amber-100", 
    text: "text-amber-700", 
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: AlertCircle 
  },
  "out of stock": { 
    bg: "bg-rose-100", 
    text: "text-rose-700", 
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: X 
  },
};

const defaultConfig = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  border: "border-slate-200",
  dot: "bg-slate-400",
  icon: AlertCircle,
};

const sizeStyles = {
  sm: { pill: "text-[10px] px-2 py-0.5", icon: "h-3 w-3", dot: "h-1.5 w-1.5" },
  md: { pill: "text-xs px-2.5 py-1", icon: "h-3.5 w-3.5", dot: "h-2 w-2" },
  lg: { pill: "text-sm px-3 py-1.5", icon: "h-4 w-4", dot: "h-2.5 w-2.5" },
};

export default function StatusBadge({ 
  status, 
  variant = "pill", 
  size = "md",
  showIcon = false,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const config = statusConfig[normalized] || defaultConfig;
  const sizes = sizeStyles[size];
  const Icon = config.icon;

  if (variant === "dot") {
    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          "rounded-full animate-pulse",
          sizes.dot,
          config.dot
        )} />
        <span className={cn(
          "capitalize font-medium",
          size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-[13px]",
          config.text
        )}>
          {status}
        </span>
      </div>
    );
  }

  if (variant === "outline") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 font-semibold capitalize",
        sizes.pill,
        config.border,
        config.text,
        "bg-white"
      )}>
        {showIcon && <Icon className={cn(sizes.icon, normalized === "processing" && "animate-spin")} />}
        {status}
      </span>
    );
  }

  if (variant === "soft") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium capitalize",
        sizes.pill,
        config.bg,
        config.text,
        "bg-opacity-60"
      )}>
        {showIcon && <Icon className={cn(sizes.icon, normalized === "processing" && "animate-spin")} />}
        {status}
      </span>
    );
  }

  // Default pill variant
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold capitalize",
      sizes.pill,
      config.bg,
      config.text
    )}>
      {showIcon && <Icon className={cn(sizes.icon, normalized === "processing" && "animate-spin")} />}
      {status}
    </span>
  );
}
