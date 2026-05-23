"use client";

// ============================================
// Toast Notification Component - Modern Design
// ============================================

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast } from "@/store/slices/ui/ui.slice";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const toastIcons = {
  success: {
    Icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/80",
    border: "border-green-200 dark:border-green-800",
  },
  error: {
    Icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/80",
    border: "border-red-200 dark:border-red-800",
  },
  warning: {
    Icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/80",
    border: "border-amber-200 dark:border-amber-800",
  },
  info: {
    Icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/80",
    border: "border-blue-200 dark:border-blue-800",
  },
};

export default function ToastContainer() {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((state) => state.ui);

  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};
    
    toasts.forEach((toast) => {
      if (!timers[toast.id]) {
        timers[toast.id] = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, toast.duration || 4000);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [toasts, dispatch]);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color, bg, border } = toastIcons[toast.type];
        
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-slideDown",
              bg,
              border
            )}
            style={{
              animation: "slideDown 0.3s ease-out"
            }}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", color)} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.title}</h4>
              {toast.message && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
