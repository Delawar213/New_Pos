"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useGetTransactionsQuery } from "@/store/api";

const columns: Column<Transaction>[] = [
  { key: "transactionCode", label: "Code" },
  { key: "title", label: "Title" },
  {
    key: "status",
    label: "Status",
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "transactionDetails",
    label: "Amount",
    render: (item) => (
      <span className="font-semibold">
        {formatCurrency(
          item.transactionDetails.reduce((sum, detail) => sum + Number(detail.debit || 0), 0)
        )}
      </span>
    ),
  },
  {
    key: "transactionDetails",
    label: "Method/Account",
    render: (item) => <span>{item.transactionDetails[0]?.accountType || "-"}</span>,
  },
  { key: "referenceNo", label: "Reference" },
  { key: "description", label: "Description" },
  {
    key: "transactionDate",
    label: "Date",
    render: (item) => <span>{new Date(item.transactionDate).toLocaleDateString()}</span>,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

export default function TransactionsPage() {
  const { data, isLoading } = useGetTransactionsQuery({ pageNumber: 1, pageSize: 10 });
  const transactions = data?.data.data || [];
  const totalCount = data?.data.totalRecords || 0;

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Track income, expenses, and transfers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions" },
        ]}
      />
      <DataTable
        columns={columns}
        data={transactions}
        rowKey="transactionId"
        title="All Transactions"
        totalCount={totalCount}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Transaction"
        onFilter={() => {}}
        onExport={() => {}}
        loading={isLoading}
      />
    </div>
  );
}
