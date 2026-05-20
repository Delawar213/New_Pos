"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";
import { getReturnableSaleLines } from "@/lib/saleReturn";
import type { Sale, SaleReturnResultData } from "@/types/sale";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSaleById,
  fetchSaleByInvoiceNumber,
  processSaleReturn,
} from "@/store/slices/sale/sale.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { bankAccountDropdownLabel } from "@/lib/partyDropdownLabels";
import { addToast } from "@/store/slices/ui/ui.slice";
import { Loader2, Search, RotateCcw } from "lucide-react";

const CASH_ACCOUNT_ID = 1;

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isCancelled(sale: Sale): boolean {
  return String(sale.status).toLowerCase() === "cancelled";
}

export default function SaleReturnPage() {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector((s) => s.sale.actionLoading);
  const bankAccounts = useAppSelector((s) => s.bankAccount.dropdownAccounts);

  const [query, setQuery] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDate, setReturnDate] = useState(todayYmd);
  const [refundType, setRefundType] = useState<"Cash" | "Credit">("Cash");
  const [fullCreditRefund, setFullCreditRefund] = useState(false);
  const [bankAccountId, setBankAccountId] = useState(CASH_ACCOUNT_ID);
  const [lineQty, setLineQty] = useState<Record<number, string>>({});
  const [lastResult, setLastResult] = useState<SaleReturnResultData | null>(null);

  useEffect(() => {
    void dispatch(fetchBankAccountsDropdown());
  }, [dispatch]);

  const returnable = useMemo(() => (sale ? getReturnableSaleLines(sale.items) : []), [sale]);

  useEffect(() => {
    if (!sale) {
      setLineQty({});
      return;
    }
    const next: Record<number, string> = {};
    getReturnableSaleLines(sale.items).forEach(({ item }) => {
      next[item.id] = "0";
    });
    setLineQty(next);
  }, [sale?.id]);

  const loadSale = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      dispatch(addToast({ type: "warning", title: "Required", message: "Enter invoice number or sale ID." }));
      return;
    }
    setLastResult(null);
    try {
      const loaded = /^\d+$/.test(q)
        ? await dispatch(fetchSaleById({ id: Number(q), updateSelection: false })).unwrap()
        : await dispatch(fetchSaleByInvoiceNumber(q)).unwrap();
      setSale(loaded);
      dispatch(addToast({ type: "success", title: "Sale loaded", message: loaded.invoiceNo }));
    } catch (e) {
      setSale(null);
      dispatch(
        addToast({
          type: "error",
          title: "Not found",
          message: typeof e === "string" ? e : "Could not load this sale.",
        })
      );
    }
  }, [dispatch, query]);

  const resetFlow = () => {
    setSale(null);
    setQuery("");
    setReturnReason("");
    setReturnDate(todayYmd());
    setRefundType("Cash");
    setFullCreditRefund(false);
    setBankAccountId(CASH_ACCOUNT_ID);
    setLineQty({});
    setLastResult(null);
  };

  const submitReturn = async () => {
    if (!sale) return;
    if (isCancelled(sale)) {
      dispatch(addToast({ type: "warning", title: "Not allowed", message: "Cannot return a cancelled sale." }));
      return;
    }
    if (!returnReason.trim()) {
      dispatch(addToast({ type: "warning", title: "Reason required", message: "Enter a return reason." }));
      return;
    }

    if (refundType === "Cash") {
      if (!bankAccountId || bankAccountId < 1) {
        dispatch(
          addToast({ type: "warning", title: "Bank account", message: "Select a bank account for cash refund." })
        );
        return;
      }
    }

    let returnDetails: { saleDetailId: number; returnQuantity: number }[] = [];
    let bankId: number | null = refundType === "Cash" ? bankAccountId : null;

    if (refundType === "Credit" && fullCreditRefund) {
      returnDetails = [];
    } else {
      for (const { item, maxReturn } of returnable) {
        const raw = String(lineQty[item.id] ?? "0").trim();
        const n = parseInt(raw, 10);
        if (!Number.isFinite(n) || n <= 0) continue;
        if (n > maxReturn) {
          dispatch(
            addToast({
              type: "warning",
              title: "Invalid quantity",
              message: `Return quantity (${n}) exceeds returnable (${maxReturn}) for ${item.productName ?? "line"}.`,
            })
          );
          return;
        }
        returnDetails.push({ saleDetailId: item.id, returnQuantity: n });
      }
      if (returnDetails.length === 0) {
        dispatch(
          addToast({
            type: "warning",
            title: "Return lines",
            message:
              refundType === "Credit" && fullCreditRefund
                ? "Use full credit refund or enter quantities."
                : "Enter return quantity (greater than 0) for at least one line.",
          })
        );
        return;
      }
    }

    try {
      const res = await dispatch(
        processSaleReturn({
          saleId: sale.id,
          returnDate,
          returnReason: returnReason.trim(),
          refundType,
          bankAccountId: bankId,
          returnDetails,
        })
      ).unwrap();

      setLastResult(res.data);
      dispatch(addToast({ type: "success", title: "Return processed", message: res.message }));
      try {
        const refreshed = await dispatch(
          fetchSaleById({ id: sale.id, updateSelection: false })
        ).unwrap();
        setSale(refreshed);
      } catch {
        /* keep previous sale view */
      }
    } catch (e) {
      dispatch(
        addToast({
          type: "error",
          title: "Return failed",
          message: typeof e === "string" ? e : "Request failed.",
        })
      );
    }
  };

  const canReturn = sale && !isCancelled(sale) && returnable.length > 0;
  const cashAccount = useMemo(
    () => bankAccounts.find((a) => a.bankAccountId === CASH_ACCOUNT_ID),
    [bankAccounts]
  );
  const banksExCash = bankAccounts.filter((a) => a.bankAccountId !== CASH_ACCOUNT_ID);

  return (
    <div>
      <PageHeader
        title="Sale return"
        description="Load a sale by invoice or ID, enter return quantities, then submit."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales", href: "/sales" },
          { label: "Return" },
        ]}
      />

      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-slate-800">Step 1 — Load sale</h2>
          <p className="mt-1 text-xs text-slate-500">
            Invoice (e.g. INV-20260513-7402) or numeric sale ID.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadSale()}
              placeholder="Invoice or sale ID"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            />
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void loadSale()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Load
            </button>
          </div>
        </div>

        {sale && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p className="font-mono text-lg font-bold text-slate-900">{sale.invoiceNo}</p>
                <p className="text-xs text-slate-500">
                  Sale #{sale.id} · {sale.customerName ?? "—"} · Status:{" "}
                  <span className="font-semibold capitalize">{sale.status}</span>
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">{formatCurrency(sale.grandTotal)} total</p>
                <p className="text-xs text-slate-500">
                  Paid {formatCurrency(sale.paidAmount)} · {sale.paymentMethod}
                </p>
              </div>
            </div>

            {isCancelled(sale) ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                This sale is cancelled — returns are disabled.
              </p>
            ) : returnable.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No returnable lines (all returned or nothing left to return).
              </p>
            ) : (
              <>
                <h3 className="mt-4 text-sm font-bold text-slate-800">Step 2 — Return quantities</h3>
                <p className="text-xs text-slate-500">Max per line = sold quantity minus already returned.</p>
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {returnable.map(({ item, maxReturn }) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{item.productName ?? "—"}</p>
                        {item.sku ? <p className="text-xs text-slate-500 font-mono">{item.sku}</p> : null}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="tabular-nums">Return qty (max {maxReturn})</span>
                        <input
                          type="number"
                          min={0}
                          max={maxReturn}
                          disabled={refundType === "Credit" && fullCreditRefund}
                          value={lineQty[item.id] ?? "0"}
                          onChange={(e) =>
                            setLineQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="h-9 w-20 rounded-md border border-slate-200 px-2 text-right text-sm font-semibold tabular-nums disabled:bg-slate-100"
                        />
                      </label>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-6 text-sm font-bold text-slate-800">Step 3 — Refund</h3>
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="refund"
                      checked={refundType === "Cash"}
                      onChange={() => {
                        setRefundType("Cash");
                        setFullCreditRefund(false);
                      }}
                    />
                    Cash refund (money out of selected account)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="refund"
                      checked={refundType === "Credit"}
                      onChange={() => setRefundType("Credit")}
                    />
                    Credit refund (customer account)
                  </label>
                </div>

                {refundType === "Credit" && (
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={fullCreditRefund}
                      onChange={(e) => setFullCreditRefund(e.target.checked)}
                    />
                    Full credit return (entire remaining sale — API uses empty line list)
                  </label>
                )}

                {refundType === "Cash" && (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Refund from account</label>
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(Number(e.target.value) || CASH_ACCOUNT_ID)}
                      className="h-10 w-full max-w-md rounded-lg border border-slate-200 px-2 text-sm"
                    >
                      <option value={CASH_ACCOUNT_ID}>
                        {cashAccount
                          ? bankAccountDropdownLabel(cashAccount)
                          : `Cash — ${formatCurrency(0)}`}
                      </option>
                      {banksExCash.map((a) => (
                        <option key={a.bankAccountId} value={a.bankAccountId}>
                          {bankAccountDropdownLabel(a)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Return date</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Return reason</label>
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="e.g. Damaged product"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canReturn || actionLoading}
                  onClick={() => void submitReturn()}
                  className={cn(
                    "mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm sm:w-auto sm:min-w-[200px]",
                    "bg-amber-600 hover:bg-amber-700 disabled:opacity-40"
                  )}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit return
                </button>
              </>
            )}
          </div>
        )}

        {lastResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm shadow-sm">
            <p className="font-bold text-emerald-900">Return recorded</p>
            <p className="mt-1 text-emerald-800">
              Total returned: <strong>{formatCurrency(lastResult.totalReturnAmount)}</strong> · New status:{" "}
              <strong>{lastResult.newPaymentStatus}</strong>
            </p>
            {lastResult.transactionCode ? (
              <p className="text-xs text-emerald-700">Transaction: {lastResult.transactionCode}</p>
            ) : null}
            {lastResult.returnedItems?.length ? (
              <ul className="mt-2 list-inside list-disc text-xs text-emerald-900">
                {lastResult.returnedItems.map((r) => (
                  <li key={r.saleDetailId}>
                    {r.productName ?? `#${r.saleDetailId}`} × {r.returnQuantity} →{" "}
                    {formatCurrency(r.returnAmount)}
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={resetFlow}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Process another return
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          <Link href="/sales" className="font-semibold text-blue-600 hover:underline">
            ← Back to sales list
          </Link>
        </p>
      </div>
    </div>
  );
}
