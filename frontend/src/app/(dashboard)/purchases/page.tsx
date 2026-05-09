"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Purchase } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useGetPurchasesQuery } from "@/store/api";

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
  const { data, isLoading } = useGetPurchasesQuery(
    { pageNumber: 1, pageSize: 100 },
    { refetchOnMountOrArgChange: true }
  );
  const purchases = data?.data?.data ?? [];
  const totalCount = data?.data?.totalRecords ?? 0;

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
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => router.push("/purchases/new")}
        addLabel="Add Purchase"
        onFilter={() => {}}
        onExport={() => {}}
        loading={isLoading}
      />
    </div>
  );
}
