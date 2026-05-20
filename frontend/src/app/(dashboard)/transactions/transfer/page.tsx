"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Loader2 } from "lucide-react";
import { DecimalInput, PageHeader, SearchableSelect } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { cn } from "@/lib/utils";
import { todayInputDate, dateInputToIso } from "@/lib/transactionDate";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { createTransferTransaction } from "@/store/slices/transaction/transaction.slice";

const lbl = "mb-1 block text-sm font-medium text-slate-700";
const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function RecordTransferPage() {
  const dispatch = useAppDispatch();
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);
  const { actionLoading } = useAppSelector((s) => s.transaction);

  const [transferDate, setTransferDate] = useState(todayInputDate);
  const [fromBankAccountId, setFromBankAccountId] = useState(0);
  const [toBankAccountId, setToBankAccountId] = useState(0);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  useEffect(() => {
    void dispatch(fetchBankAccountsDropdown());
  }, [dispatch]);

  const bankOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      dropdownAccounts.map((a) => ({
        value: a.bankAccountId,
        label: `${a.accountName} (${a.accountType})`,
        search: `${a.accountName} ${a.accountType}`.toLowerCase(),
      })),
    [dropdownAccounts]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBankAccountId <= 0 || toBankAccountId <= 0) {
      dispatch(addToast({ type: "warning", title: "Accounts required", message: "Select from and to accounts." }));
      return;
    }
    if (fromBankAccountId === toBankAccountId) {
      dispatch(addToast({ type: "warning", title: "Invalid transfer", message: "From and to accounts must differ." }));
      return;
    }
    if (amount <= 0) {
      dispatch(addToast({ type: "warning", title: "Amount required", message: "Enter a transfer amount." }));
      return;
    }

    const result = await dispatch(
      createTransferTransaction({
        transferDate: dateInputToIso(transferDate),
        fromBankAccountId,
        toBankAccountId,
        amount: round2(amount),
        description: description.trim() || undefined,
        referenceNo: referenceNo.trim() || undefined,
        createdBy: null,
      })
    );

    if (createTransferTransaction.rejected.match(result)) {
      dispatch(
        addToast({
          type: "error",
          title: "Transfer failed",
          message: result.payload || "Could not record transfer.",
          duration: 7000,
        })
      );
      return;
    }

    const code = result.payload?.data?.transactionCode;
    dispatch(
      addToast({
        type: "success",
        title: "Transfer recorded",
        message: code ? `Saved. Code: ${code}` : result.payload?.message || "Transfer saved.",
        duration: 6000,
      })
    );
    setAmount(0);
    setDescription("");
    setReferenceNo("");
    setFromBankAccountId(0);
    setToBankAccountId(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <PageHeader
        title="Record transfer"
        description="Move funds between accounts via POST /api/Transactions/transfer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions", href: "/transactions" },
          { label: "Transfer" },
        ]}
        actions={
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Transfer details</h2>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Transfer date *</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={lbl}>Reference no.</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className={inputBase}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className={lbl}>From account (credit) *</label>
            <SearchableSelect
              options={bankOptions}
              value={fromBankAccountId}
              onChange={setFromBankAccountId}
              placeholder="Source account…"
              emptyHint="No accounts"
              triggerClassName="border-slate-200 py-2.5"
            />
          </div>

          <div>
            <label className={lbl}>To account (debit) *</label>
            <SearchableSelect
              options={bankOptions}
              value={toBankAccountId}
              onChange={setToBankAccountId}
              placeholder="Destination account…"
              emptyHint="No accounts"
              triggerClassName="border-slate-200 py-2.5"
            />
          </div>

          <div>
            <label className={lbl}>Amount *</label>
            <DecimalInput
              value={amount}
              onChange={setAmount}
              emptyWhenZero
              className={cn(inputBase, "text-right text-lg font-bold")}
            />
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={cn(inputBase, "resize-y")}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Link
            href="/transactions"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={actionLoading}
            className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post transfer
          </button>
        </footer>
      </form>
    </div>
  );
}
