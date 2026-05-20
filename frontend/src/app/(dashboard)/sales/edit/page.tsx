"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, SearchableSelect, type SearchableSelectOption } from "@/components/ui";
import { customerDropdownLabel, customerSearchText } from "@/lib/partyDropdownLabels";
import { formatCurrency, cn } from "@/lib/utils";
import {
  authUserIsAdmin,
  saleEditRequiresAdmin,
  saleUpdateBlockedReason,
  toApiSaleStatus,
} from "@/lib/saleEdit";
import { listInStockBatchesSorted, pickFifoBatch } from "@/lib/saleScan";
import type { Sale, SaleItem, SaleUpdateResultSummary, SaleUpdateThunkArg } from "@/types/sale";
import type { SaleBarcodeScanData, SaleScanBatch } from "@/types/sale";
import type { CustomerDropdown } from "@/types/customer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSaleById,
  fetchSaleByInvoiceNumber,
  scanPosBarcode,
  updateSale,
} from "@/store/slices/sale/sale.slice";
import { fetchCustomersDropdown } from "@/store/slices/customer/customer.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import { Loader2, Search, Trash2, Barcode } from "lucide-react";

const WALK_IN_CUSTOMER_ID = 1;

type OverallDiscMode = "none" | "amount" | "percent";
type LineDiscMode = "none" | "amount" | "percent";

type EditLine = {
  key: string;
  saleDetailId: number;
  productId: number;
  purchaseDetailId: number;
  productName: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  sellingPriceExVat: number;
  lineDisc: LineDiscMode;
  itemDiscountAmount: number;
  itemDiscountPercentage: number;
  isReturned: boolean;
};

function ymdFromSaleDate(iso: string): string {
  const s = String(iso ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

function saleItemsToEditLines(items: SaleItem[]): EditLine[] {
  return items.map((it) => {
    const hasAmt = it.itemDiscountAmount != null && Number(it.itemDiscountAmount) > 0;
    const hasPct = it.itemDiscountPercentage != null && Number(it.itemDiscountPercentage) > 0;
    const lineDisc: LineDiscMode = hasAmt ? "amount" : hasPct ? "percent" : "none";
    return {
      key: `l-${it.id}`,
      saleDetailId: it.id,
      productId: it.productId,
      purchaseDetailId: it.purchaseDetailId ?? 0,
      productName: it.productName ?? "—",
      sku: it.sku,
      quantity: it.quantity,
      sellingPriceExVat: it.unitPrice,
      lineDisc,
      itemDiscountAmount: hasAmt ? Number(it.itemDiscountAmount) : 0,
      itemDiscountPercentage: hasPct ? Number(it.itemDiscountPercentage) : 0,
      isReturned: Boolean(it.isReturned),
    };
  });
}

function buildUpdatePayload(
  sale: Sale,
  customerId: number,
  saleDateYmd: string,
  description: string,
  notes: string | null,
  overallDisc: OverallDiscMode,
  discountAmount: number,
  discountPercentage: number,
  lines: EditLine[]
): SaleUpdateThunkArg {
  const discAmount =
    overallDisc === "amount" ? (discountAmount > 0 ? discountAmount : null) : null;
  const discPct =
    overallDisc === "percent" ? (discountPercentage > 0 ? discountPercentage : null) : null;
  const saleDetails = lines.map((ln) => {
    const itemDiscountAmount =
      ln.lineDisc === "amount" && ln.itemDiscountAmount > 0 ? ln.itemDiscountAmount : null;
    const itemDiscountPercentage =
      ln.lineDisc === "percent" && ln.itemDiscountPercentage > 0
        ? ln.itemDiscountPercentage
        : null;
    return {
      saleDetailId: ln.saleDetailId,
      productId: ln.productId,
      purchaseDetailId: ln.purchaseDetailId,
      quantity: ln.quantity,
      sellingPriceExVat: ln.sellingPriceExVat,
      itemDiscountAmount,
      itemDiscountPercentage,
    };
  });
  return {
    id: sale.id,
    customerId,
    saleDate: saleDateYmd,
    discountAmount: discAmount,
    discountPercentage: discPct,
    description,
    notes,
    status: toApiSaleStatus(sale.status),
    saleDetails,
  };
}

export default function SaleEditPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const actionLoading = useAppSelector((s) => s.sale.actionLoading);
  const dropdownCustomers = useAppSelector((s) => s.customer.dropdownCustomers);
  const authUser = useAppSelector((s) => s.auth.user);

  const [query, setQuery] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [customerId, setCustomerId] = useState<number>(WALK_IN_CUSTOMER_ID);
  const [saleDateYmd, setSaleDateYmd] = useState("");
  const [overallDisc, setOverallDisc] = useState<OverallDiscMode>("none");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<EditLine[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [batchPick, setBatchPick] = useState<SaleBarcodeScanData | null>(null);
  const [saveSummary, setSaveSummary] = useState<SaleUpdateResultSummary | null>(null);

  const isAdmin = useMemo(() => authUserIsAdmin(authUser), [authUser]);

  useEffect(() => {
    void dispatch(fetchCustomersDropdown());
  }, [dispatch]);

  const hydrateFromSale = useCallback((s: Sale) => {
    setSale(s);
    setCustomerId(s.customerId && s.customerId > 0 ? s.customerId : WALK_IN_CUSTOMER_ID);
    setSaleDateYmd(ymdFromSaleDate(s.saleDate));
    const dp = s.discountPercentage;
    if (dp != null && Number(dp) > 0) {
      setOverallDisc("percent");
      setDiscountPercentage(Number(dp));
      setDiscountAmount(0);
    } else if (s.discountAmount > 0) {
      setOverallDisc("amount");
      setDiscountAmount(s.discountAmount);
      setDiscountPercentage(0);
    } else {
      setOverallDisc("none");
      setDiscountAmount(0);
      setDiscountPercentage(0);
    }
    setDescription(s.description ?? s.note ?? "");
    setNotes(s.notes != null ? String(s.notes) : "");
    setLines(saleItemsToEditLines(s.items ?? []));
    setSaveSummary(null);
  }, []);

  const loadSale = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) {
        dispatch(addToast({ type: "warning", title: "Required", message: "Enter invoice or sale ID." }));
        return;
      }
      try {
        const loaded = /^\d+$/.test(q)
          ? await dispatch(fetchSaleById({ id: Number(q), updateSelection: false })).unwrap()
          : await dispatch(fetchSaleByInvoiceNumber(q)).unwrap();
        hydrateFromSale(loaded);
        dispatch(addToast({ type: "success", title: "Loaded", message: loaded.invoiceNo }));
      } catch (e) {
        setSale(null);
        setLines([]);
        dispatch(
          addToast({
            type: "error",
            title: "Not found",
            message: typeof e === "string" ? e : "Could not load sale.",
          })
        );
      }
    },
    [dispatch, hydrateFromSale]
  );

  useEffect(() => {
    const idParam = searchParams.get("saleId");
    if (idParam && /^\d+$/.test(idParam.trim())) {
      void loadSale(idParam.trim());
    }
  }, [searchParams, loadSale]);

  const customerOptions = useMemo((): SearchableSelectOption<number>[] => {
    const rows = dropdownCustomers ?? [];
    const opts = rows.map((c: CustomerDropdown) => ({
      value: c.customerId,
      label: customerDropdownLabel(c),
      search: customerSearchText(c),
    }));
    if (!opts.some((o) => o.value === WALK_IN_CUSTOMER_ID)) {
      opts.unshift({
        value: WALK_IN_CUSTOMER_ID,
        label: "Walking customer",
        search: "walking 1",
      });
    }
    return opts;
  }, [dropdownCustomers]);

  const blocked = sale ? saleUpdateBlockedReason(sale) : null;
  const needsAdmin = sale ? saleEditRequiresAdmin(sale) : false;
  const saveDisabledByRole = Boolean(sale && needsAdmin && !isAdmin);

  const updateLine = (key: string, patch: Partial<EditLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => {
      const ln = prev.find((l) => l.key === key);
      if (!ln || ln.isReturned) return prev;
      return prev.filter((l) => l.key !== key);
    });
  };

  const addLineFromBatch = (scan: SaleBarcodeScanData, batch: SaleScanBatch) => {
    setLines((prev) => {
      const existing = prev.find(
        (l) =>
          !l.isReturned &&
          l.saleDetailId === 0 &&
          l.productId === scan.productId &&
          l.purchaseDetailId === batch.purchaseDetailId
      );
      if (existing) {
        return prev.map((l) =>
          l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      const key =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `n-${crypto.randomUUID()}`
          : `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return [
        ...prev,
        {
          key,
          saleDetailId: 0,
          productId: scan.productId,
          purchaseDetailId: batch.purchaseDetailId,
          productName: scan.productName,
          sku: scan.productCode,
          barcode: String(scan.barcode ?? "").trim(),
          quantity: 1,
          sellingPriceExVat: batch.sellingPriceExVat,
          lineDisc: "none" as LineDiscMode,
          itemDiscountAmount: 0,
          itemDiscountPercentage: 0,
          isReturned: false,
        },
      ];
    });
    dispatch(addToast({ type: "success", title: "Cart line", message: scan.productName }));
  };

  const onScanSubmit = async () => {
    const code = barcodeInput.trim();
    if (!code) return;
    try {
      const scan = await dispatch(scanPosBarcode(code)).unwrap();
      const batches = listInStockBatchesSorted(scan);
      if (batches.length === 0) {
        dispatch(addToast({ type: "warning", title: "Stock", message: "No stock for this product." }));
        return;
      }
      if (Boolean(scan.hasMultipleBatches) && batches.length > 1) {
        setBatchPick(scan);
      } else {
        addLineFromBatch(scan, pickFifoBatch(scan));
      }
      setBarcodeInput("");
    } catch (e) {
      dispatch(
        addToast({
          type: "error",
          title: "Scan failed",
          message: typeof e === "string" ? e : "Barcode not found.",
        })
      );
    }
  };

  const validateBeforeSave = (): string | null => {
    if (!sale) return "No sale loaded.";
    if (blocked) return blocked;
    if (customerId < 1) return "Select a customer.";
    if (!saleDateYmd) return "Sale date is required.";
    if (overallDisc === "amount" && discountAmount < 0) return "Discount amount cannot be negative.";
    if (overallDisc === "percent" && (discountPercentage < 0 || discountPercentage > 100)) {
      return "Discount percentage must be 0–100.";
    }
    for (const ln of lines) {
      if (ln.isReturned) continue;
      if (ln.quantity <= 0) return `Quantity must be greater than 0 for ${ln.productName}.`;
      if (ln.sellingPriceExVat <= 0) return `Price must be greater than 0 for ${ln.productName}.`;
      if (ln.lineDisc === "amount" && ln.itemDiscountAmount < 0) return "Invalid line discount amount.";
      if (ln.lineDisc === "percent" && (ln.itemDiscountPercentage < 0 || ln.itemDiscountPercentage > 100)) {
        return `Invalid line discount % for ${ln.productName}.`;
      }
      if (ln.saleDetailId === 0 && (!ln.purchaseDetailId || ln.purchaseDetailId < 1)) {
        return `Missing batch (purchaseDetailId) for new line: ${ln.productName}.`;
      }
    }
    if (saveDisabledByRole) return "Only an administrator can update a sale that has payments.";
    return null;
  };

  const onSave = async () => {
    const err = validateBeforeSave();
    if (err) {
      dispatch(addToast({ type: "warning", title: "Check form", message: err }));
      return;
    }
    if (!sale) return;
    try {
      const payload = buildUpdatePayload(
        sale,
        customerId,
        saleDateYmd,
        description.trim(),
        notes.trim() === "" ? null : notes.trim(),
        overallDisc,
        discountAmount,
        discountPercentage,
        lines
      );
      const res = await dispatch(updateSale(payload)).unwrap();
      dispatch(addToast({ type: "success", title: "Saved", message: res.message || "Sale updated." }));
      const data = res.data as SaleUpdateResultSummary | undefined;
      if (data && typeof data === "object" && "saleId" in data) {
        setSaveSummary(data as SaleUpdateResultSummary);
      }
      const refreshed = await dispatch(fetchSaleById({ id: sale.id, updateSelection: false })).unwrap();
      hydrateFromSale(refreshed);
    } catch (e) {
      dispatch(
        addToast({
          type: "error",
          title: "Update failed",
          message: typeof e === "string" ? e : "Request failed.",
        })
      );
    }
  };

  const formLocked = Boolean(blocked);

  return (
    <div>
      <PageHeader
        title="Edit sale"
        description="Load an invoice, adjust header and lines, then save. Returned lines are read-only."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales", href: "/sales" },
          { label: "Edit" },
        ]}
      />

      <div className="mx-auto max-w-4xl space-y-4 px-1 pb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Load sale</h2>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadSale(query)}
              placeholder="Invoice or sale ID"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            />
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void loadSale(query)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Load
            </button>
          </div>
        </div>

        {sale && (
          <>
            {blocked ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {blocked}
              </p>
            ) : null}
            {needsAdmin && !isAdmin ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                This sale has payments. Only an administrator can save changes (you are signed in as a
                non-admin).
              </p>
            ) : null}

            {saveSummary ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-950">
                <p className="font-bold">Last save</p>
                <p className="mt-1 tabular-nums">
                  Total {formatCurrency(saveSummary.totalAmountIncVat)} · Paid{" "}
                  {formatCurrency(saveSummary.paidAmount)} · Due {formatCurrency(saveSummary.remainingAmount)}{" "}
                  · {saveSummary.paymentStatus} / {saveSummary.status}
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="font-mono text-lg font-bold">{sale.invoiceNo}</p>
                  <p className="text-xs text-slate-500">Sale #{sale.id}</p>
                </div>
                <p className="text-sm text-slate-600">
                  Current total {formatCurrency(sale.grandTotal)} · Paid {formatCurrency(sale.paidAmount)}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Customer</label>
                  <SearchableSelect
                    options={customerOptions}
                    value={customerId}
                    onChange={(v) => setCustomerId(Number(v))}
                    placeholder="Select customer"
                    disabled={formLocked}
                    triggerClassName="h-10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Sale date</label>
                  <input
                    type="date"
                    value={saleDateYmd}
                    onChange={(e) => setSaleDateYmd(e.target.value)}
                    disabled={formLocked}
                    className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Overall discount</label>
                  <div className="flex flex-wrap gap-2">
                    {(["none", "amount", "percent"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="odisc"
                          checked={overallDisc === m}
                          disabled={formLocked}
                          onChange={() => setOverallDisc(m)}
                        />
                        {m === "none" ? "None" : m === "amount" ? "Amount" : "%"}
                      </label>
                    ))}
                  </div>
                  {overallDisc === "amount" ? (
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      disabled={formLocked}
                      className="mt-2 h-9 w-full max-w-xs rounded-md border border-slate-200 px-2 text-sm"
                    />
                  ) : null}
                  {overallDisc === "percent" ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value) || 0)}
                      disabled={formLocked}
                      className="mt-2 h-9 w-full max-w-xs rounded-md border border-slate-200 px-2 text-sm"
                    />
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={formLocked}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={formLocked}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-800">Lines</h3>
                {!formLocked ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Barcode className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void onScanSubmit()}
                        placeholder="Scan or type barcode — Enter"
                        className="h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void onScanSubmit()}
                      disabled={actionLoading}
                      className="h-10 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Add product
                    </button>
                  </div>
                ) : null}

                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-2">Product</th>
                        <th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Ex VAT</th>
                        <th className="px-2 py-2">Line disc.</th>
                        <th className="w-10 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((ln) => (
                        <tr key={ln.key} className={ln.isReturned ? "bg-slate-50/80" : ""}>
                          <td className="px-2 py-2">
                            <p className="font-semibold text-slate-900">{ln.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              #{ln.productId}
                              {ln.sku ? ` · ${ln.sku}` : ""}
                              {ln.isReturned ? (
                                <span className="ml-2 font-bold text-amber-700">Returned</span>
                              ) : ln.saleDetailId ? (
                                <span className="ml-2">detail #{ln.saleDetailId}</span>
                              ) : (
                                <span className="ml-2 text-emerald-700">New line</span>
                              )}
                            </p>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              className="h-9 w-16 rounded border border-slate-200 px-1 text-right disabled:bg-slate-100"
                              value={ln.quantity}
                              disabled={formLocked || ln.isReturned}
                              onChange={(e) =>
                                updateLine(ln.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0.01}
                              step="0.01"
                              className="h-9 w-24 rounded border border-slate-200 px-1 text-right disabled:bg-slate-100"
                              value={ln.sellingPriceExVat}
                              disabled={formLocked || ln.isReturned}
                              onChange={(e) =>
                                updateLine(ln.key, {
                                  sellingPriceExVat: Math.max(0.01, Number(e.target.value) || 0),
                                })
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              <select
                                className="h-8 max-w-[140px] rounded border border-slate-200 text-xs disabled:bg-slate-100"
                                value={ln.lineDisc}
                                disabled={formLocked || ln.isReturned}
                                onChange={(e) =>
                                  updateLine(ln.key, { lineDisc: e.target.value as LineDiscMode })
                                }
                              >
                                <option value="none">None</option>
                                <option value="amount">Amount</option>
                                <option value="percent">%</option>
                              </select>
                              {ln.lineDisc === "amount" ? (
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="h-8 w-24 rounded border border-slate-200 px-1 text-xs disabled:bg-slate-100"
                                  value={ln.itemDiscountAmount}
                                  disabled={formLocked || ln.isReturned}
                                  onChange={(e) =>
                                    updateLine(ln.key, { itemDiscountAmount: Number(e.target.value) || 0 })
                                  }
                                />
                              ) : null}
                              {ln.lineDisc === "percent" ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.1"
                                  className="h-8 w-20 rounded border border-slate-200 px-1 text-xs disabled:bg-slate-100"
                                  value={ln.itemDiscountPercentage}
                                  disabled={formLocked || ln.isReturned}
                                  onChange={(e) =>
                                    updateLine(ln.key, {
                                      itemDiscountPercentage: Number(e.target.value) || 0,
                                    })
                                  }
                                />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {!ln.isReturned && !formLocked ? (
                              <button
                                type="button"
                                aria-label="Remove line"
                                onClick={() => removeLine(ln.key)}
                                className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={formLocked || saveDisabledByRole || actionLoading || lines.length === 0}
                  onClick={() => void onSave()}
                  className={cn(
                    "inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl px-5 text-sm font-bold text-white",
                    "bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                  )}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => void loadSale(String(sale.id))}
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  Reload from server
                </button>
              </div>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-500">
          <Link href="/sales" className="font-semibold text-blue-600 hover:underline">
            ← Sales list
          </Link>
        </p>
      </div>

      {batchPick ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close"
            onClick={() => setBatchPick(null)}
          />
          <div className="relative max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <p className="font-bold text-slate-900">Choose batch</p>
            <p className="mt-1 text-xs text-slate-600">{batchPick.productName}</p>
            <ul className="mt-3 space-y-2">
              {listInStockBatchesSorted(batchPick).map((b) => (
                <li key={b.purchaseDetailId}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      addLineFromBatch(batchPick, b);
                      setBatchPick(null);
                    }}
                  >
                    <span className="font-mono text-xs text-slate-500">#{b.purchaseDetailId}</span>{" "}
                    {b.batchNumber ?? "—"} · rem {b.remainingQuantity} · ex VAT{" "}
                    {formatCurrency(b.sellingPriceExVat)}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setBatchPick(null)}
              className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
