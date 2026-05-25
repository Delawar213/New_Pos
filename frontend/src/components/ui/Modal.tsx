"use client";

// ============================================
// Modal Component - Modern Design
// ============================================

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  /** When false, body is not max-height constrained (e.g. wide forms that should fit without inner scroll). */
  scrollableContent?: boolean;
  /** Extra classes on the modal panel (e.g. custom max-width). */
  className?: string;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
  full: "max-w-7xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
  showCloseButton = true,
  scrollableContent = true,
  className,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const isFullHeight = scrollableContent;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative flex w-full max-h-[min(92dvh,920px)] flex-col bg-white shadow-2xl animate-scaleIn",
          "rounded-t-2xl sm:max-h-[min(90dvh,920px)] sm:rounded-2xl",
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "min-h-0 px-4 py-4 sm:px-6 sm:py-5",
            isFullHeight
              ? "flex-1 overflow-y-auto overscroll-contain scrollbar-thin"
              : "overflow-visible"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:rounded-b-2xl sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Pre-styled buttons for modal footer
export function ModalCancelButton({ 
  onClick, 
  children = "Cancel" 
}: { 
  onClick: () => void; 
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300"
    >
      {children}
    </button>
  );
}

export function ModalConfirmButton({ 
  onClick, 
  children = "Confirm",
  variant = "primary",
  disabled = false,
}: { 
  onClick: () => void; 
  children?: React.ReactNode;
  variant?: "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        variant === "primary" 
          ? "bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-500/25 hover:shadow-blue-500/30"
          : "bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/25 hover:shadow-rose-500/30"
      )}
    >
      {children}
    </button>
  );
}
