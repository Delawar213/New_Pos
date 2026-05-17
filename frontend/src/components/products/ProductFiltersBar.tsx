"use client";

import React from "react";
import {
  Archive,
  AlertTriangle,
  Filter,
  Layers,
  Printer,
  Search,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductListMode } from "@/types/product";

export type StockFilterValue = "all" | "outofstock" | "lowstock";

interface ProductFiltersBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  categoryId: number | "";
  brandId: number | "";
  stockFilter: StockFilterValue;
  categoryOptions: { value: number; label: string }[];
  brandOptions: { value: number; label: string }[];
  onCategoryChange: (categoryId: number | "") => void;
  onBrandChange: (brandId: number | "") => void;
  onStockFilterChange: (value: StockFilterValue) => void;
  onClearFilters: () => void;
  listMode: ProductListMode;
  listFilterLabel: string;
  resultCount: number;
  loading?: boolean;
  /** Shown while user types before debounced search runs. */
  searchPending?: boolean;
  canPrintStock?: boolean;
  onPrintStock?: () => void;
  printDisabled?: boolean;
}

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

export function ProductFiltersBar({
  searchInput,
  onSearchChange,
  categoryId,
  brandId,
  stockFilter,
  categoryOptions,
  brandOptions,
  onCategoryChange,
  onBrandChange,
  onStockFilterChange,
  onClearFilters,
  listMode,
  listFilterLabel,
  resultCount,
  loading = false,
  searchPending = false,
  canPrintStock = false,
  onPrintStock,
  printDisabled = false,
}: ProductFiltersBarProps) {
  const hasActiveFilter =
    listMode !== "catalog" ||
    categoryId !== "" ||
    brandId !== "" ||
    stockFilter !== "all" ||
    searchInput.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Find products</p>
              <p className="text-xs text-slate-500">
                Dropdowns apply on change · search waits briefly after you stop typing
              </p>
            </div>
          </div>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Quick search — name, code, barcode (min. 2 characters)…"
            disabled={loading}
            className={cn(
              "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm",
              "outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          />
          {searchPending ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-blue-600">
              Searching…
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Layers className="h-3.5 w-3.5" />
              Category
            </span>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={categoryId === "" ? "" : String(categoryId)}
                onChange={(e) => {
                  const v = e.target.value;
                  onCategoryChange(v === "" ? "" : Number(v));
                }}
                disabled={loading}
                className={selectClass}
              >
                <option value="">All categories</option>
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Tag className="h-3.5 w-3.5" />
              Brand
            </span>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={brandId === "" ? "" : String(brandId)}
                onChange={(e) => {
                  const v = e.target.value;
                  onBrandChange(v === "" ? "" : Number(v));
                }}
                disabled={loading}
                className={selectClass}
              >
                <option value="">All brands</option>
                {brandOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              Stock status
            </span>
            <div className="relative">
              <Archive className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={stockFilter}
                onChange={(e) => onStockFilterChange(e.target.value as StockFilterValue)}
                disabled={loading}
                className={selectClass}
              >
                <option value="all">All stock levels</option>
                <option value="outofstock">Out of stock</option>
                <option value="lowstock">Low stock</option>
              </select>
            </div>
          </label>
        </div>

        {listFilterLabel ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-blue-800">Active view</span>
              <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-sm">
                {listFilterLabel}
              </span>
              <span className="text-xs text-blue-600/80">
                {resultCount} {resultCount === 1 ? "product" : "products"}
              </span>
            </div>
            {canPrintStock && onPrintStock ? (
              <button
                type="button"
                onClick={onPrintStock}
                disabled={printDisabled || loading || resultCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print list
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
