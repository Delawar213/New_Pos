"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { BankAccount, CashAccount, CreateBankAccountRequest } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateBankAccountMutation,
  useGetAccountBalanceQuery,
  useGetAccountsDropdownQuery,
  useGetBankAccountsQuery,
  useGetBankOnlyAccountsQuery,
  useGetCashAccountsQuery,
  useGetTotalBankBalanceQuery,
  useGetTotalCashBalanceQuery,
} from "@/store/api";

const columns: Column<BankAccount>[] = [
  { key: "bankAccountId", label: "#", className: "w-16" },
  { key: "accountName", label: "Account Name" },
  { key: "accountType", label: "Type" },
  { key: "bankName", label: "Bank" },
  { key: "accountNumber", label: "Account #" },
  { key: "sortCode", label: "Sort Code" },
  {
    key: "currentBalance",
    label: "Balance",
    render: (item) => (
      <span className={`font-semibold ${item.currentBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
        {formatCurrency(item.currentBalance)}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

const cashColumns: Column<CashAccount>[] = [
  { key: "bankAccountId", label: "#", className: "w-16" },
  { key: "accountName", label: "Cash Account Name" },
  { key: "accountType", label: "Type" },
  {
    key: "currentBalance",
    label: "Balance",
    render: (item) => (
      <span className={`font-semibold ${item.currentBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
        {formatCurrency(item.currentBalance)}
      </span>
    ),
  },
];

export default function BankAccountsPage() {
  const { data: bankAccounts = [], isLoading } = useGetBankAccountsQuery();
  const { data: cashAccounts = [] } = useGetCashAccountsQuery();
  const { data: bankOnlyAccounts = [] } = useGetBankOnlyAccountsQuery();
  const { data: dropdownAccounts = [] } = useGetAccountsDropdownQuery();
  const { data: totalCashBalance = 0 } = useGetTotalCashBalanceQuery();
  const { data: totalBankBalance = 0 } = useGetTotalBankBalanceQuery();
  const firstAccountId = useMemo(() => bankAccounts[0]?.bankAccountId, [bankAccounts]);
  const { data: firstAccountBalance = 0 } = useGetAccountBalanceQuery(firstAccountId ?? 0, {
    skip: !firstAccountId,
  });
  const [createBankAccount, { isLoading: creating }] = useCreateBankAccountMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateBankAccountRequest>({
    accountName: "",
    accountNumber: "",
    accountType: "Cash",
    bankName: null,
    branchName: null,
    sortCode: "",
    openingBalance: 0,
    isActive: true,
  });

  const handleCreate = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim()) return;
    const payload: CreateBankAccountRequest = {
      ...form,
      bankName: form.accountType === "Cash" ? null : form.bankName || null,
      branchName: form.accountType === "Cash" ? null : form.branchName || null,
    };
    const result = await createBankAccount(payload);
    if (!("error" in result)) {
      setModalOpen(false);
      setForm({
        accountName: "",
        accountNumber: "",
        accountType: "Cash",
        bankName: null,
        branchName: null,
        sortCode: "",
        openingBalance: 0,
        isActive: true,
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Bank Accounts"
        description="Manage bank accounts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bank Accounts" },
        ]}
      />
      <DataTable
        columns={columns}
        data={bankAccounts}
        rowKey="bankAccountId"
        title="All Bank Accounts"
        totalCount={bankAccounts.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => setModalOpen(true)}
        addLabel="Add Bank Account"
        loading={isLoading}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Cash Balance</p>
          <p className={`text-xl font-semibold ${totalCashBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatCurrency(totalCashBalance)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Bank Balance</p>
          <p className={`text-xl font-semibold ${totalBankBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatCurrency(totalBankBalance)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Selected Account Balance</p>
          <p className={`text-xl font-semibold ${firstAccountBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatCurrency(firstAccountBalance)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Accounts Dropdown Source ({dropdownAccounts.length})</h3>
        <div className="flex flex-wrap gap-2">
          {dropdownAccounts.map((item) => (
            <span key={item.bankAccountId} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {item.accountName} ({item.accountType})
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          columns={cashColumns}
          data={cashAccounts}
          rowKey="bankAccountId"
          title="Cash Accounts"
          totalCount={cashAccounts.length}
          onSearch={(term) => console.log("Cash Search:", term)}
          onAdd={() => setModalOpen(true)}
          addLabel="Add Cash Account"
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={cashColumns}
          data={bankOnlyAccounts}
          rowKey="bankAccountId"
          title="Bank Accounts (Bank Type)"
          totalCount={bankOnlyAccounts.length}
          onSearch={(term) => console.log("Bank Type Search:", term)}
          onAdd={() => setModalOpen(true)}
          addLabel="Add Bank Account"
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Bank Account"
        description="Add a new bank or cash account"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.accountName.trim() || !form.accountNumber.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Saving..." : "Save Account"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Account Name *</label>
            <input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Account Number *</label>
            <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Account Type *</label>
            <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Opening Balance</label>
            <input type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
            <input value={form.bankName || ""} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Branch Name</label>
            <input value={form.branchName || ""} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Sort Code</label>
            <input value={form.sortCode || ""} onChange={(e) => setForm({ ...form, sortCode: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
              Active
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
