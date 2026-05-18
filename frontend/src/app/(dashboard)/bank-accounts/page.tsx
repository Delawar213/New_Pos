"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Landmark, PieChart, Plus, RefreshCw, Wallet } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal, StatsCard } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { BankAccount, CashAccount, CreateBankAccountRequest } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { filterRowsBySearch } from "@/lib/filterRowsBySearch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import {
  loadBankAccountPage,
  fetchBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  clearBankAccountState,
  clearSelectedBankAccount,
} from "@/store/slices/bankAccount/bankAccount.slice";

const emptyForm = (): CreateBankAccountRequest => ({
  accountName: "",
  accountNumber: "",
  accountType: "Cash",
  bankName: null,
  branchName: null,
  sortCode: "",
  openingBalance: 0,
  isActive: true,
});

function formFromAccount(a: BankAccount): CreateBankAccountRequest {
  return {
    accountName: a.accountName,
    accountNumber: a.accountNumber,
    accountType: a.accountType,
    bankName: a.bankName || null,
    branchName: a.branchName ?? null,
    sortCode: a.sortCode ?? "",
    openingBalance: a.openingBalance,
    isActive: a.isActive,
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export default function BankAccountsPage() {
  const dispatch = useAppDispatch();
  const {
    bankAccounts,
    cashAccounts,
    bankOnlyAccounts,
    dropdownAccounts,
    totalCashBalance,
    totalBankBalance,
    firstAccountBalance,
    loading,
    actionLoading,
    error,
    success,
    message,
  } = useAppSelector((s) => s.bankAccount);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<CreateBankAccountRequest>(emptyForm());

  const [searchAll, setSearchAll] = useState("");
  const [searchCash, setSearchCash] = useState("");
  const [searchBank, setSearchBank] = useState("");
  const debouncedAll = useDebouncedValue(searchAll, 250);
  const debouncedCash = useDebouncedValue(searchCash, 250);
  const debouncedBank = useDebouncedValue(searchBank, 250);

  const filteredBankAccounts = useMemo(
    () =>
      filterRowsBySearch(bankAccounts, debouncedAll, (r) => [
        r.accountName,
        r.accountNumber,
        r.accountType,
        r.bankName ?? "",
        r.sortCode ?? "",
        r.branchName ?? "",
      ]),
    [bankAccounts, debouncedAll]
  );
  const filteredCashAccounts = useMemo(
    () =>
      filterRowsBySearch(cashAccounts, debouncedCash, (r) => [
        r.accountName,
        r.accountType,
        String(r.currentBalance),
      ]),
    [cashAccounts, debouncedCash]
  );
  const filteredBankOnly = useMemo(
    () =>
      filterRowsBySearch(bankOnlyAccounts, debouncedBank, (r) => [
        r.accountName,
        r.accountNumber,
        r.accountType,
        r.bankName ?? "",
        r.sortCode ?? "",
        r.branchName ?? "",
      ]),
    [bankOnlyAccounts, debouncedBank]
  );

  const combinedLiquidity = totalCashBalance + totalBankBalance;
  const leadAccountName = bankAccounts[0]?.accountName;

  useEffect(() => {
    dispatch(loadBankAccountPage());
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(
        addToast({
          type: "success",
          title: "Success",
          message,
          duration: 3000,
        })
      );
      dispatch(clearBankAccountState());
      dispatch(loadBankAccountPage());
    }
    if (error) {
      dispatch(
        addToast({
          type: "error",
          title: "Error",
          message: error,
          duration: 5000,
        })
      );
      dispatch(clearBankAccountState());
    }
  }, [success, error, message, dispatch]);

  const resetModal = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
    dispatch(clearSelectedBankAccount());
  }, [dispatch]);

  const openCreate = useCallback(() => {
    resetModal();
    setModalOpen(true);
  }, [resetModal]);

  const openEdit = useCallback(
    async (accountOrId: BankAccount | number) => {
      const id = typeof accountOrId === "number" ? accountOrId : accountOrId.bankAccountId;
      let full: BankAccount | undefined =
        typeof accountOrId === "object" ? accountOrId : bankAccounts.find((a) => a.bankAccountId === id);
      if (!full) {
        try {
          const res = await dispatch(fetchBankAccountById(id)).unwrap();
          full = res.data;
        } catch {
          dispatch(
            addToast({
              type: "error",
              title: "Error",
              message: "Could not load account for editing.",
              duration: 4000,
            })
          );
          return;
        }
      }
      setEditingId(full.bankAccountId);
      setForm(formFromAccount(full));
      setModalOpen(true);
    },
    [bankAccounts, dispatch]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetModal();
  }, [resetModal]);

  const handleSubmit = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation",
          message: "Account name and account number are required.",
          duration: 3000,
        })
      );
      return;
    }

    if (editingId != null) {
      const result = await dispatch(
        updateBankAccount({
          bankAccountId: editingId,
          ...form,
        })
      );
      if (updateBankAccount.fulfilled.match(result)) {
        closeModal();
      }
      return;
    }

    const result = await dispatch(createBankAccount(form));
    if (createBankAccount.fulfilled.match(result)) {
      closeModal();
    }
  };

  const confirmDelete = (account: BankAccount) => {
    setAccountToDelete(account);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    const result = await dispatch(deleteBankAccount(accountToDelete.bankAccountId));
    if (deleteBankAccount.fulfilled.match(result)) {
      setDeleteOpen(false);
      setAccountToDelete(null);
    }
  };

  const baseColumns = useMemo<Column<BankAccount>[]>(
    () => [
      { key: "accountName", label: "Account Name" },
      { key: "accountType", label: "Type" },
      { key: "bankName", label: "Bank" },
      { key: "accountNumber", label: "Account #" },
      { key: "sortCode", label: "Sort Code" },
      {
        key: "currentBalance",
        label: "Balance",
        render: (item) => (
          <span
            className={cn(
              "font-semibold tabular-nums",
              item.currentBalance >= 0 ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {formatCurrency(item.currentBalance)}
          </span>
        ),
      },
      {
        key: "isActive",
        label: "Status",
        render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
      },
    ],
    []
  );

  const columns: Column<BankAccount>[] = useMemo(
    () => [
      ...baseColumns,
      {
        key: "actions",
        label: "Actions",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void openEdit(item);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(item);
              }}
              disabled={actionLoading}
              className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [baseColumns, actionLoading, openEdit]
  );

  const cashColumns: Column<CashAccount>[] = useMemo(
    () => [
      { key: "accountName", label: "Account Name" },
      { key: "accountType", label: "Type" },
      {
        key: "currentBalance",
        label: "Balance",
        render: (item) => (
          <span
            className={cn(
              "font-semibold tabular-nums",
              item.currentBalance >= 0 ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {formatCurrency(item.currentBalance)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void openEdit(item.bankAccountId);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const full = bankAccounts.find((a) => a.bankAccountId === item.bankAccountId);
                if (full) {
                  confirmDelete(full);
                  return;
                }
                void dispatch(fetchBankAccountById(item.bankAccountId))
                  .unwrap()
                  .then((res) => confirmDelete(res.data))
                  .catch(() => {
                    dispatch(
                      addToast({
                        type: "error",
                        title: "Error",
                        message: "Could not load account to delete.",
                        duration: 4000,
                      })
                    );
                  });
              }}
              disabled={actionLoading}
              className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [actionLoading, bankAccounts, dispatch, openEdit]
  );

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Bank & cash accounts"
        description="Register, balances, and liquidity across cash drawers and bank accounts. Figures reflect your live API totals."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bank Accounts" },
        ]}
        badge={`${bankAccounts.length} registered`}
        badgeColor="blue"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(loadBankAccountPage())}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New account
            </button>
          </div>
        }
      />

      {/* Financial summary — formal KPI row */}
      <section aria-label="Balance summary">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Balance summary</h2>
            <p className="mt-0.5 text-xs text-slate-400">All amounts in GBP (£) · Updated when you refresh or save changes</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total cash"
            value={formatCurrency(totalCashBalance)}
            icon={Wallet}
            color="green"
          />
          <StatsCard
            title="Total bank"
            value={formatCurrency(totalBankBalance)}
            icon={Landmark}
            color="indigo"
          />
          <StatsCard
            title="Combined liquidity"
            value={formatCurrency(combinedLiquidity)}
            icon={PieChart}
            color="cyan"
          />
          <StatsCard
            title={leadAccountName ? `Lead account · ${leadAccountName}` : "First account balance"}
            value={formatCurrency(firstAccountBalance)}
            icon={Building2}
            color="blue"
          />
        </div>
      </section>

      {/* Full register */}
      <section className="space-y-3" aria-label="All accounts">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Full register</h2>
            <p className="text-xs text-slate-500">All cash and bank accounts in one view</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredBankAccounts}
          rowKey="bankAccountId"
          title="All accounts"
          description="Sortable grid of every registered account"
          totalCount={filteredBankAccounts.length}
          searchQuery={searchAll}
          onSearchChange={setSearchAll}
          searchPlaceholder="Filter by name, number, bank…"
          onAdd={openCreate}
          addLabel="New account"
          onRefresh={() => dispatch(loadBankAccountPage())}
          loading={loading}
        />
      </section>

      {/* Posting reference */}
      <section
        className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm"
        aria-label="Accounts for postings"
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Posting reference</h2>
            <p className="text-xs text-slate-500">
              Accounts exposed for receipts, payments, and journals ({dropdownAccounts.length})
            </p>
          </div>
        </div>
        {dropdownAccounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            No dropdown accounts returned from the API.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dropdownAccounts.map((item) => (
              <span
                key={item.bankAccountId}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
              >
                <span className="max-w-[200px] truncate">{item.accountName}</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {item.accountType}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Split: cash vs bank */}
      <section className="space-y-3" aria-label="Accounts by type">
        <div className="px-1">
          <h2 className="text-base font-semibold text-slate-900">By account type</h2>
          <p className="text-xs text-slate-500">Focused views for cash operations and bank books</p>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DataTable
            columns={cashColumns}
            data={filteredCashAccounts}
            rowKey="bankAccountId"
            title="Cash accounts"
            description="Drawers, tills, and cash-in-hand"
            totalCount={filteredCashAccounts.length}
            searchQuery={searchCash}
            onSearchChange={setSearchCash}
            searchPlaceholder="Filter cash accounts…"
            onAdd={openCreate}
            addLabel="Add cash account"
          />
          <DataTable
            columns={cashColumns}
            data={filteredBankOnly}
            rowKey="bankAccountId"
            title="Bank accounts"
            description="Institutional bank books only"
            totalCount={filteredBankOnly.length}
            searchQuery={searchBank}
            onSearchChange={setSearchBank}
            searchPlaceholder="Filter bank accounts…"
            onAdd={openCreate}
            addLabel="Add bank account"
          />
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId != null ? "Edit account" : "New account"}
        description={
          editingId != null
            ? "Update the registered account. Balances may still follow transaction rules from your backend."
            : "Create a cash or bank account for use in the POS and ledger."
        }
        size="lg"
        scrollableContent
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={actionLoading || !form.accountName.trim() || !form.accountNumber.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {actionLoading ? "Saving…" : editingId != null ? "Save changes" : "Create account"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account name *
            </label>
            <input
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account number *
            </label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account type *
            </label>
            <select
              value={form.accountType}
              onChange={(e) => setForm({ ...form, accountType: e.target.value })}
              className={inputClass}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Opening balance
            </label>
            <input
              type="number"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bank name
            </label>
            <input
              value={form.bankName ?? ""}
              onChange={(e) => setForm({ ...form, bankName: e.target.value || null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Branch name
            </label>
            <input
              value={form.branchName ?? ""}
              onChange={(e) => setForm({ ...form, branchName: e.target.value || null })}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort code
            </label>
            <input
              value={form.sortCode ?? ""}
              onChange={(e) => setForm({ ...form, sortCode: e.target.value })}
              className={inputClass}
            />
          </div>
          {editingId != null && (
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
              Running balances are usually driven by posted transactions. If an update is rejected, confirm whether your
              API allows changing opening balance after activity exists.
            </div>
          )}
          <div className="flex items-center md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              Account is active
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setAccountToDelete(null);
        }}
        title="Remove account"
        description={
          accountToDelete
            ? `This will remove “${accountToDelete.accountName}” (${accountToDelete.accountNumber}). The server may block this if movements exist.`
            : ""
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setAccountToDelete(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={actionLoading}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? "Removing…" : "Remove account"}
            </button>
          </div>
        }
      >
        <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            Deletion is permanent from this register when the API allows it. Reconcile open transactions before removing
            an account used in daily operations.
          </p>
        </div>
      </Modal>
    </div>
  );
}
