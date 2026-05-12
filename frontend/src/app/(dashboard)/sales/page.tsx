"use client";

import React, { useEffect, useState, useRef } from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Sale } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSales } from "@/store/slices/sale/sale.slice";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";

const columns: Column<Sale>[] = [
  { key: "invoiceNo", label: "Invoice" },
  { key: "customerName", label: "Customer" },
  { key: "saleDate", label: "Date" },
  {
    key: "grandTotal",
    label: "Total",
    render: (item) => <span className="font-semibold">{formatCurrency(item.grandTotal)}</span>,
  },
  {
    key: "paidAmount",
    label: "Paid",
    render: (item) => <span>{formatCurrency(item.paidAmount)}</span>,
  },
  {
    key: "dueAmount",
    label: "Due",
    render: (item) => (
      <span className={item.dueAmount > 0 ? "font-semibold text-red-600" : "text-gray-500"}>
        {formatCurrency(item.dueAmount)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
          View
        </button>
        <button type="button" className="text-xs text-green-600 hover:text-green-800">
          Print
        </button>
      </div>
    ),
  },
];

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);
  const { sales, totalCount, loading, error } = useAppSelector((s) => s.sale);

  useEffect(() => {
    void dispatch(fetchSales(buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, page, pageSize]);

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Manage sales and invoices"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales" },
        ]}
      />
      {error && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      <DataTable
        columns={columns}
        data={sales}
        rowKey="id"
        title="All Sales"
        totalCount={totalCount}
        pageNumber={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search invoice, customer…"
        onAdd={() => {}}
        addLabel="New Sale"
        onFilter={() => {}}
        onExport={() => {}}
        onRefresh={() =>
          void dispatch(
            fetchSales({
              pageNumber: page,
              pageSize,
              sortDirection: "desc",
              searchTerm: debouncedSearch.trim() || undefined,
            })
          )
        }
        loading={loading}
      />
    </div>
  );
}
