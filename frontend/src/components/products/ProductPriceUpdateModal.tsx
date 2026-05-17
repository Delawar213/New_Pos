"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Tag } from "lucide-react";
import { Modal } from "@/components/ui";
import type { Product, ProductBatchesForPricing, ProductPricingBatch } from "@/types";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { exVatToIncVat } from "@/lib/saleScan";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductBatchesForPricing,
  updateProductSellingPrice,
} from "@/store/slices/product/product.slice";
import { addToast } from "@/store/slices/ui/ui.slice";

type PriceMode = "all" | "per-batch";

interface BatchDraft {
  purchaseDetailId: number;
  sellingPriceExVat: number;
  sellingPriceIncVat: number;
  vatRate: number;
  source: ProductPricingBatch;
}

interface ProductPriceUpdateModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function buildBatchDrafts(record: ProductBatchesForPricing): BatchDraft[] {
  return record.batches.map((b) => ({
    purchaseDetailId: b.purchaseDetailId,
    sellingPriceExVat: b.sellingPriceExVat,
    sellingPriceIncVat: b.sellingPriceIncVat,
    vatRate: b.vatRate,
    source: b,
  }));
}

export function ProductPriceUpdateModal({
  product,
  open,
  onClose,
  onSaved,
}: ProductPriceUpdateModalProps) {
  const dispatch = useAppDispatch();
  const { pricingLoading, actionLoading } = useAppSelector((s) => s.product);

  const [record, setRecord] = useState<ProductBatchesForPricing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [priceMode, setPriceMode] = useState<PriceMode>("all");
  const [allBatchesExVat, setAllBatchesExVat] = useState(0);
  const [defaultExVat, setDefaultExVat] = useState(0);
  const [batchDrafts, setBatchDrafts] = useState<BatchDraft[]>([]);
  const [updateProductDefault, setUpdateProductDefault] = useState(true);
  const [reason, setReason] = useState("");

  const resetForm = useCallback(() => {
    setRecord(null);
    setLoadError(null);
    setPriceMode("all");
    setAllBatchesExVat(0);
    setDefaultExVat(0);
    setBatchDrafts([]);
    setUpdateProductDefault(true);
    setReason("");
  }, []);

  const loadPricing = useCallback(async () => {
    if (!product) return;
    setLoadError(null);
    const result = await dispatch(fetchProductBatchesForPricing(product.productId));
    if (fetchProductBatchesForPricing.fulfilled.match(result)) {
      const data = result.payload;
      setRecord(data);
      setAllBatchesExVat(data.sellingPrice);
      setDefaultExVat(data.sellingPrice);
      setBatchDrafts(buildBatchDrafts(data));
      return;
    }
    setLoadError(
      (result.payload as string) || "Could not load batch pricing for this product."
    );
  }, [dispatch, product]);

  useEffect(() => {
    if (!open || !product) {
      resetForm();
      return;
    }
    void loadPricing();
  }, [open, product, loadPricing, resetForm]);

  const productVatRate = record?.vatRate ?? product?.vatRate ?? 0;
  const minSellingPrice = record?.minSellingPrice ?? 0;

  const allBatchesIncVat = useMemo(
    () => exVatToIncVat(allBatchesExVat, productVatRate),
    [allBatchesExVat, productVatRate]
  );

  const defaultIncVat = useMemo(
    () => exVatToIncVat(defaultExVat, productVatRate),
    [defaultExVat, productVatRate]
  );

  const updateBatchExVat = (purchaseDetailId: number, exVat: number) => {
    setBatchDrafts((rows) =>
      rows.map((row) => {
        if (row.purchaseDetailId !== purchaseDetailId) return row;
        const sellingPriceExVat = Math.max(0, exVat);
        return {
          ...row,
          sellingPriceExVat,
          sellingPriceIncVat: exVatToIncVat(sellingPriceExVat, row.vatRate),
        };
      })
    );
  };

  const handleClose = () => {
    if (actionLoading) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!product || !record) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 2) {
      dispatch(
        addToast({
          type: "error",
          title: "Reason required",
          message: "Enter a short reason for this price change.",
          duration: 4000,
        })
      );
      return;
    }

    const checkMin = (ex: number, label: string) => {
      if (minSellingPrice > 0 && ex > 0 && ex < minSellingPrice) {
        dispatch(
          addToast({
            type: "error",
            title: "Below minimum price",
            message: `${label} must be at least ${formatCurrency(minSellingPrice)} (ex VAT).`,
            duration: 5000,
          })
        );
        return true;
      }
      return false;
    };

    if (priceMode === "all") {
      if (checkMin(allBatchesExVat, "Batch price")) return;
      if (updateProductDefault && checkMin(allBatchesExVat, "Default price")) return;
    } else {
      for (const row of batchDrafts) {
        if (checkMin(row.sellingPriceExVat, `Batch #${row.purchaseDetailId}`)) return;
      }
      if (updateProductDefault && checkMin(defaultExVat, "Default price")) return;
    }

    const batchUpdates =
      priceMode === "per-batch"
        ? batchDrafts.map((row) => ({
            purchaseDetailId: row.purchaseDetailId,
            sellingPriceExVat: row.sellingPriceExVat,
            sellingPriceIncVat: row.sellingPriceIncVat,
          }))
        : [];

    const newSellingPriceExVat =
      priceMode === "all" ? allBatchesExVat : updateProductDefault ? defaultExVat : 0;

    const result = await dispatch(
      updateProductSellingPrice({
        productId: product.productId,
        updateAllBatches: priceMode === "all",
        newSellingPriceExVat,
        batchUpdates,
        updateProductDefault,
        reason: trimmedReason,
        updatedBy: 0,
      })
    );

    if (updateProductSellingPrice.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Price updated",
          message: result.payload.message,
          duration: 3000,
        })
      );
      onSaved?.();
      onClose();
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={handleClose}
        disabled={actionLoading}
        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={actionLoading || pricingLoading || !record}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
        Save prices
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Update selling price"
      description={
        product ? `${product.productCode} · ${product.productName}` : undefined
      }
      size="xl"
      footer={footer}
      scrollableContent
    >
      {pricingLoading && !record ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading batch pricing…</p>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {loadError}
          <button
            type="button"
            onClick={() => void loadPricing()}
            className="mt-2 block text-sm font-semibold text-rose-700 underline"
          >
            Retry
          </button>
        </div>
      ) : record ? (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Current default (ex VAT)" value={formatCurrency(record.sellingPrice)} />
            <SummaryItem
              label="Min selling price"
              value={minSellingPrice > 0 ? formatCurrency(minSellingPrice) : "—"}
            />
            <SummaryItem label="VAT rate" value={`${formatNumber(productVatRate)}%`} />
            <SummaryItem label="Stock on hand" value={formatNumber(record.qtyInStock)} />
          </div>

          {minSellingPrice > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Prices below {formatCurrency(minSellingPrice)} (ex VAT) may be rejected by the server.
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pricing mode</p>
            <div className="flex flex-wrap gap-2">
              <ModeButton
                active={priceMode === "all"}
                onClick={() => setPriceMode("all")}
                label="Same price for all batches"
              />
              <ModeButton
                active={priceMode === "per-batch"}
                onClick={() => setPriceMode("per-batch")}
                label="Set price per batch"
              />
            </div>
          </div>

          {priceMode === "all" ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                New selling price for all batches (ex VAT)
              </label>
              <div className="flex flex-wrap items-end gap-4">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={allBatchesExVat}
                  onChange={(e) => setAllBatchesExVat(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 w-40 rounded-lg border border-slate-200 px-3 text-sm font-semibold tabular-nums"
                />
                <p className="text-sm text-slate-500">
                  Inc VAT ({formatNumber(productVatRate)}%):{" "}
                  <span className="font-bold text-slate-800">{formatCurrency(allBatchesIncVat)}</span>
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Applies to {record.batches.length} batch
                {record.batches.length === 1 ? "" : "es"} with stock.
              </p>
            </div>
          ) : (
            <>
              {updateProductDefault ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <label className="mb-1 block text-xs font-semibold text-emerald-900">
                    Product default price (ex VAT)
                  </label>
                  <div className="flex flex-wrap items-end gap-4">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={defaultExVat}
                      onChange={(e) => setDefaultExVat(Math.max(0, Number(e.target.value) || 0))}
                      className="h-10 w-40 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold tabular-nums"
                    />
                    <p className="text-sm text-emerald-800">
                      Inc VAT: <span className="font-bold">{formatCurrency(defaultIncVat)}</span>
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Batch</th>
                      <th className="px-3 py-2">Purchase</th>
                      <th className="px-3 py-2">Supplier</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Ex VAT</th>
                      <th className="px-3 py-2 text-right">Inc VAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchDrafts.map((row) => (
                      <tr key={row.purchaseDetailId}>
                        <td className="px-3 py-2">
                          <p className="font-mono text-xs font-semibold text-slate-800">
                            {row.source.batchNumber || "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">#{row.purchaseDetailId}</p>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          <p>{row.source.purchaseCode ?? "—"}</p>
                          <p className="text-slate-400">
                            {row.source.purchaseDate
                              ? formatDate(row.source.purchaseDate)
                              : "—"}
                          </p>
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2 text-xs text-slate-600">
                          {row.source.supplierName ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {formatCurrency(row.source.costPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                          {row.source.remainingQuantity}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.sellingPriceExVat}
                            onChange={(e) =>
                              updateBatchExVat(
                                row.purchaseDetailId,
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            className="ml-auto block h-9 w-24 rounded-lg border border-slate-200 px-2 text-right text-sm tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-700">
                          {formatCurrency(row.sellingPriceIncVat)}
                          <span className="block text-[10px] font-normal text-slate-400">
                            VAT {formatNumber(row.vatRate)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchDrafts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No batches with stock.</p>
                ) : null}
              </div>
            </>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={updateProductDefault}
              onChange={(e) => setUpdateProductDefault(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Update product default selling price
          </label>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Reason for change <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Supplier price increase, promotion ended…"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      )}
    >
      {label}
    </button>
  );
}
