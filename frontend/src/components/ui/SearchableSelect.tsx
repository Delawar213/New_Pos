"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.search.includes(q));
  }, [options, query]);

  const openList = () => {
    if (disabled) return;
    const idx = Math.max(
      0,
      filtered.findIndex((o) => o.value === value)
    );
    setHighlightIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const selectIndex = (index: number) => {
    const opt = filtered[index];
    if (!opt) return;
    onChange(opt.value);
    closeList();
  };

  const moveHighlight = (delta: number) => {
    if (filtered.length === 0) return;
    setHighlightIndex((i) => {
      const next = (i + delta + filtered.length) % filtered.length;
      optionRefs.current[next]?.scrollIntoView({ block: "nearest" });
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHighlightIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openList();
        else if (e.key === "ArrowDown") moveHighlight(1);
        else if (e.key === "ArrowUp") moveHighlight(-1);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        }
        break;
      default:
        break;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (filtered.length > 0) selectIndex(highlightIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "Tab":
        setOpen(false);
        setQuery("");
        break;
      case "Home":
        e.preventDefault();
        if (filtered.length > 0) {
          setHighlightIndex(0);
          optionRefs.current[0]?.scrollIntoView({ block: "nearest" });
        }
        break;
      case "End":
        e.preventDefault();
        if (filtered.length > 0) {
          const last = filtered.length - 1;
          setHighlightIndex(last);
          optionRefs.current[last]?.scrollIntoView({ block: "nearest" });
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && filtered[highlightIndex]
            ? `${listboxId}-opt-${highlightIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
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
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Type to search…"
              aria-controls={listboxId}
              aria-autocomplete="list"
              role="combobox"
              aria-expanded
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <ul id={listboxId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyHint ?? "No matches"}</li>
            ) : (
              filtered.map((o, index) => {
                const isSelected = o.value === value;
                const isHighlighted = index === highlightIndex;
                return (
                  <li
                    key={String(o.value)}
                    role="option"
                    id={`${listboxId}-opt-${index}`}
                    aria-selected={isSelected}
                  >
                    <button
                      ref={(el) => {
                        optionRefs.current[index] = el;
                      }}
                      type="button"
                      tabIndex={-1}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm",
                        isHighlighted && "bg-blue-50 text-blue-900",
                        !isHighlighted && "hover:bg-slate-50",
                        isSelected && !isHighlighted && "font-medium text-slate-900"
                      )}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => selectIndex(index)}
                    >
                      {o.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
