"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption<V extends string | number> = {
  value: V;
  label: string;
  /** Lowercase string used for filtering */
  search: string;
};

export default function SearchableSelect<V extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  emptyHint,
  id,
  "aria-labelledby": ariaLabelledBy,
  triggerClassName,
}: {
  options: SearchableSelectOption<V>[];
  value: V;
  onChange: (value: V) => void;
  placeholder: string;
  disabled?: boolean;
  emptyHint?: string;
  id?: string;
  "aria-labelledby"?: string;
  /** Merged onto the trigger button (e.g. height/border to match text inputs). */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.search.includes(q));
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm",
          disabled && "cursor-not-allowed opacity-60",
          !selected && "text-gray-500",
          triggerClassName
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-[80] mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyHint ?? "No matches"}</li>
            ) : (
              filtered.map((o) => (
                <li key={String(o.value)} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      onChange(o.value);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
