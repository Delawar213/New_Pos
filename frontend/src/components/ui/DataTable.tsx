"use client";

// ============================================
// Data Table Component - Reusable Table
// ============================================

import React from "react";
import { ChevronLeft, ChevronRight, Search, Plus, Download, Filter } from "lucide-react";
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
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  onFilter?: () => void;
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
  searchPlaceholder = "Search...",
  onSearch,
  onAdd,
  addLabel = "Add New",
  onExport,
  onFilter,
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

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          <p className="text-xs text-gray-500">
            {totalCount} record{totalCount !== 1 && "s"} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          {onSearch && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="w-40 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          )}
          {/* Filter */}
          {onFilter && (
            <button
              onClick={onFilter}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
          )}
          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          )}
          {/* Add */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={String(item[rowKey])}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "transition-colors hover:bg-gray-50/80",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("whitespace-nowrap px-4 py-3 text-gray-700", col.className)}>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="rounded border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-sm text-gray-500">
              Page {pageNumber} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pageNumber + 1)}
              disabled={pageNumber >= totalPages}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
