"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import { DecimalInput, PageHeader, SearchableSelect } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { todayInputDate, dateInputToIso } from "@/lib/transactionDate";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { fetchExpenseCategories } from "@/store/slices/expenseCategory/expenseCategory.slice";
import { createExpenseTransaction } from "@/store/slices/transaction/transaction.slice";

const PAYMENT_METHODS = ["Cash", "Bank", "Card", "Cheque"] as const;

const lbl = "mb-1 block text-sm font-medium text-slate-700";
const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function RecordExpensePage() {
  const dispatch = useAppDispatch();
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);
  const { categories } = useAppSelector((s) => s.expenseCategory);
  const { actionLoading } = useAppSelector((s) => s.transaction);

  const [expenseDate, setExpenseDate] = useState(todayInputDate);
  const [expenseCategoryId, setExpenseCategoryId] = useState(0);
  const [title, setTitle] = useState("");
  const [amountExVat, setAmountExVat] = useState(0);
  const [vatRate, setVatRate] = useState(0);
  const [bankAccountId, setBankAccountId] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [attachmentPath, setAttachmentPath] = useState("");

  useEffect(() => {
    void dispatch(fetchBankAccountsDropdown());
    void dispatch(fetchExpenseCategories());
  }, [dispatch]);

  const categoryOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      categories
        .filter((c) => c.isActive)
        .map((c) => ({
          value: c.expenseCategoryId,
          label: `${c.categoryName} (${c.expenseType})`,
          search: `${c.categoryName} ${c.expenseType}`.toLowerCase(),
        })),
    [categories]
  );

  const bankOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      dropdownAccounts.map((a) => ({
        value: a.bankAccountId,
        label: `${a.accountName} (${a.accountType})`,
        search: `${a.accountName} ${a.accountType}`.toLowerCase(),
      })),
    [dropdownAccounts]
  );

  const selectedCategory = categories.find((c) => c.expenseCategoryId === expenseCategoryId);
  const vatAmount = round2((amountExVat * vatRate) / 100);
  const totalIncVat = round2(amountExVat + vatAmount);

  const onCategoryChange = (id: number) => {
    setExpenseCategoryId(id);
    const cat = categories.find((c) => c.expenseCategoryId === id);
    if (cat) {
      setVatRate(cat.isVatApplicable ? cat.defaultVatRate : 0);
      if (!title.trim()) setTitle(cat.categoryName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseCategoryId <= 0) {
      dispatch(addToast({ type: "warning", title: "Category required", message: "Select an expense category." }));
      return;
    }
    if (!title.trim()) {
      dispatch(addToast({ type: "warning", title: "Title required", message: "Enter an expense title." }));
      return;
    }
    if (amountExVat <= 0) {
      dispatch(addToast({ type: "warning", title: "Amount required", message: "Enter amount excluding VAT." }));
      return;
    }
    if (bankAccountId <= 0) {
      dispatch(addToast({ type: "warning", title: "Account required", message: "Select the bank/cash account paid from." }));
      return;
    }

    const result = await dispatch(
      createExpenseTransaction({
        expenseDate: dateInputToIso(expenseDate),
        expenseCategoryId,
        title: title.trim(),
        amountExVat: round2(amountExVat),
        vatRate: round2(vatRate),
        bankAccountId,
        paymentMethod,
        description: description.trim() || undefined,
        referenceNo: referenceNo.trim() || undefined,
        attachmentPath: attachmentPath.trim() || undefined,
        createdBy: null,
      })
    );

    if (createExpenseTransaction.rejected.match(result)) {
      dispatch(
        addToast({
          type: "error",
          title: "Expense failed",
          message: result.payload || "Could not record expense.",
          duration: 7000,
        })
      );
      return;
    }

    const code = result.payload?.data?.transactionCode;
    dispatch(
      addToast({
        type: "success",
        title: "Expense recorded",
        message: code ? `Saved. Code: ${code}` : result.payload?.message || "Expense saved.",
        duration: 6000,
      })
    );
    setTitle("");
    setAmountExVat(0);
    setVatRate(0);
    setDescription("");
    setReferenceNo("");
    setAttachmentPath("");
    setExpenseCategoryId(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <PageHeader
        title="Record expense"
        description="Post an expense via POST /api/Transactions/expense"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions", href: "/transactions" },
          { label: "Expense" },
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
          <Receipt className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-900">Expense details</h2>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Date *</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
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
            <label className={lbl}>Category *</label>
            <SearchableSelect
              options={categoryOptions}
              value={expenseCategoryId}
              onChange={onCategoryChange}
              placeholder="Select category…"
              emptyHint="No categories"
              triggerClassName="border-slate-200 py-2.5"
            />
            {selectedCategory ? (
              <p className="mt-1 text-xs text-slate-500">
                VAT applicable: {selectedCategory.isVatApplicable ? "Yes" : "No"}
                {selectedCategory.isVatApplicable
                  ? ` · Default rate ${selectedCategory.defaultVatRate}%`
                  : ""}
              </p>
            ) : null}
          </div>

          <div>
            <label className={lbl}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputBase}
              placeholder="Expense title"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Amount (ex VAT) *</label>
              <DecimalInput
                value={amountExVat}
                onChange={setAmountExVat}
                emptyWhenZero
                className={cn(inputBase, "text-right font-semibold")}
              />
            </div>
            <div>
              <label className={lbl}>VAT rate %</label>
              <DecimalInput
                value={vatRate}
                onChange={setVatRate}
                emptyWhenZero
                placeholder="0"
                className={cn(inputBase, "text-right")}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-600">
              VAT: <strong className="text-slate-900">{formatCurrency(vatAmount)}</strong>
              <span className="mx-2 text-slate-300">·</span>
              Total (inc VAT):{" "}
              <strong className="text-slate-900">{formatCurrency(totalIncVat)}</strong>
            </p>
          </div>

          <div>
            <label className={lbl}>Paid from account *</label>
            <SearchableSelect
              options={bankOptions}
              value={bankAccountId}
              onChange={setBankAccountId}
              placeholder="Select account…"
              emptyHint="No accounts"
              triggerClassName="border-slate-200 py-2.5"
            />
          </div>

          <div>
            <label className={lbl}>Payment method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputBase}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
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

          <div>
            <label className={lbl}>Attachment path</label>
            <input
              type="text"
              value={attachmentPath}
              onChange={(e) => setAttachmentPath(e.target.value)}
              className={inputBase}
              placeholder="Optional file path or URL"
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
            className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post expense
          </button>
        </footer>
      </form>
    </div>
  );
}
