"use client";

// ============================================
// Toast Notification Component - Modern Design
// ============================================

import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast, type Toast } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: {
    bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    icon: "text-emerald-500 bg-emerald-100",
    title: "text-emerald-800",
    message: "text-emerald-600",
  },
  error: {
    bg: "bg-gradient-to-r from-rose-50 to-pink-50",
    border: "border-rose-200",
    icon: "text-rose-500 bg-rose-100",
    title: "text-rose-800",
    message: "text-rose-600",
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-50 to-orange-50",
    border: "border-amber-200",
    icon: "text-amber-500 bg-amber-100",
    title: "text-amber-800",
    message: "text-amber-600",
  },
  info: {
    bg: "bg-gradient-to-r from-blue-50 to-violet-50",
    border: "border-blue-200",
    icon: "text-blue-500 bg-blue-100",
    title: "text-blue-800",
    message: "text-blue-600",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const Icon = iconMap[toast.type];
  const styles = styleMap[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-sm animate-slideUp",
        styles.bg,
        styles.border
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", styles.title)}>{toast.title}</p>
        {toast.message && (
          <p className={cn("mt-1 text-xs", styles.message)}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="flex h-6 w-6 items-center justify-center rounded-lg opacity-50 hover:opacity-100 hover:bg-white/50 transition-all"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex w-96 flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
