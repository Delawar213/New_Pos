"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Purchase } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPurchases } from "@/store/slices/purchases/purchases.slice";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";

function lineTotalFromDetails(item: Purchase): number | null {
  const details = item.purchaseDetails;
  if (!details?.length) return null;
  return details.reduce((sum, d) => {
    const qty = Number(d.purchaseQuantity || 0);
    const unit = Number(d.purchasePriceExVat || 0);
    return sum + qty * unit;
  }, 0);
}

const columns: Column<Purchase>[] = [
  { key: "purchaseCode", label: "Reference" },
  { key: "supplierName", label: "Supplier" },
  {
    key: "purchaseDate",
    label: "Date",
    render: (item) => <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>,
  },
  {
    key: "totalAmountIncVat",
    label: "Total (inc VAT)",
    render: (item) => {
      const fromApi = item.totalAmountIncVat;
      if (fromApi != null) {
        return <span className="font-semibold">{formatCurrency(Number(fromApi))}</span>;
      }
      const computed = lineTotalFromDetails(item);
      return (
        <span className="font-semibold">
          {computed != null ? formatCurrency(computed) : "—"}
        </span>
      );
    },
  },
  { key: "invoiceNumber", label: "Invoice" },
  {
    key: "discountPercentage",
    label: "Discount %",
    render: (item) => <span>{item.discountPercentage ?? 0}%</span>,
  },
  {
    key: "paymentStatus",
    label: "Payment",
    render: (item) =>
      item.paymentStatus ? <StatusBadge status={item.paymentStatus} /> : <span>—</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (item) =>
      item.status ? <StatusBadge status={item.status} /> : <span>—</span>,
  },
  {
    key: "createdDatetime",
    label: "Created",
    render: (item) =>
      item.createdDatetime ? (
        <span className="text-sm text-gray-600">
          {new Date(item.createdDatetime).toLocaleString()}
        </span>
      ) : (
        <span>—</span>
      ),
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
          View
        </button>
        <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
          Edit
        </button>
        <button type="button" className="text-xs text-red-600 hover:text-red-800">
          Delete
        </button>
      </div>
    ),
  },
];

export default function PurchasesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);
  const { purchases, totalCount, loading } = useAppSelector((s) => s.purchases);

  useEffect(() => {
    void dispatch(fetchPurchases(buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, page, pageSize]);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Manage purchase orders"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchases" },
        ]}
      />
      <DataTable
        columns={columns}
        data={purchases}
        rowKey="purchaseId"
        title="All Purchases"
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
        searchPlaceholder="Search reference, supplier, invoice…"
        onAdd={() => router.push("/purchases/new")}
        addLabel="Add Purchase"
        onFilter={() => {}}
        onExport={() => {}}
        onRefresh={() =>
          void dispatch(
            fetchPurchases({
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
