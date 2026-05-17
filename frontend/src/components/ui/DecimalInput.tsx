"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Parse user text to number — no leading-zero artifacts (e.g. "022" → 22). */
export function parseDecimalInput(raw: string): number {
  const s = raw.trim().replace(/,/g, "");
  if (s === "" || s === ".") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Display value for controlled decimal fields — empty when zero by default. */
export function formatDecimalInputValue(n: number, emptyWhenZero = true): string {
  if (emptyWhenZero && n === 0) return "";
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  /** Whole numbers only (quantity, etc.) */
  integer?: boolean;
  emptyWhenZero?: boolean;
}

export default function DecimalInput({
  value,
  onChange,
  className,
  id,
  placeholder = "0",
  disabled,
  min = 0,
  integer = false,
  emptyWhenZero = true,
}: DecimalInputProps) {
  const [text, setText] = useState(() => formatDecimalInputValue(value, emptyWhenZero));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setText(formatDecimalInputValue(value, emptyWhenZero));
  }, [value, emptyWhenZero]);

  const pattern = integer ? /^\d*$/ : /^\d*\.?\d*$/;

  return (
    <input
      id={id}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => {
        focusedRef.current = true;
        e.target.select();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== "" && !pattern.test(raw)) return;
        setText(raw);
        onChange(parseDecimalInput(raw));
      }}
      onBlur={() => {
        focusedRef.current = false;
        let n = parseDecimalInput(text);
        if (integer) n = Math.round(n);
        if (min != null) n = Math.max(min, n);
        onChange(n);
        setText(formatDecimalInputValue(n, emptyWhenZero));
      }}
      className={cn(
        "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums",
        "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    />
  );
}
