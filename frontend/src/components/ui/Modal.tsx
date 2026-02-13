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
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white shadow-2xl animate-scaleIn",
          sizeMap[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 rounded-b-2xl">
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
