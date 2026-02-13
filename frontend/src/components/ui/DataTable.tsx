"use client";

// ============================================
// Data Table Component - Modern Design
// ============================================

import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  Download, 
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  onFilter?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  // Pagination
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Row actions
  onRowClick?: (item: T) => void;
  rowKey: keyof T;
}

export default function DataTable<T>({
  columns,
  data,
  title,
  description,
  searchPlaceholder = "Search...",
  onSearch,
  onAdd,
  addLabel = "Add New",
  onExport,
  onFilter,
  onRefresh,
  loading = false,
  totalCount = 0,
  pageNumber = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Showing <span className="font-medium text-slate-600">{totalCount > 0 ? startRecord : 0}</span> to{" "}
              <span className="font-medium text-slate-600">{endRecord}</span> of{" "}
              <span className="font-medium text-slate-600">{totalCount}</span> records
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearch(e.target.value)}
                  className="h-10 w-48 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Filter */}
            {onFilter && (
              <button
                onClick={onFilter}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            )}

            {/* Refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300",
                  loading && "animate-spin"
                )}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {/* Export */}
            {onExport && (
              <button
                onClick={onExport}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* Add */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                <span>{addLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-4 w-24 rounded-md skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Search className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-600">No records found</p>
                    <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={String(item[rowKey])}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "border-b border-slate-50 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-blue-50/50",
                    !onRowClick && "hover:bg-slate-50/50",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className={cn(
                        "whitespace-nowrap px-5 py-4 text-sm text-slate-700",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-700">{pageNumber}</span> of{" "}
              <span className="font-semibold text-slate-700">{totalPages || 1}</span>
            </span>
            
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onPageChange?.(1)}
                disabled={pageNumber <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </button>
              <button
                onClick={() => onPageChange?.(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange?.(pageNumber + 1)}
                disabled={pageNumber >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange?.(totalPages)}
                disabled={pageNumber >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
