"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import type { Sale, SaleItem } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { printPosReceipt, buildPosReceiptSnapshotFromSale } from "@/lib/posReceipt";
import {
  Loader2,
  X,
  Printer,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Package,
  Search,
  FileText,
  Pencil,
} from "lucide-react";

function formatSaleDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function lineMatchesQuery(line: SaleItem, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const name = (line.productName ?? "").toLowerCase();
  const sku = (line.sku ?? "").toLowerCase();
  const idStr = String(line.id);
  const pid = String(line.productId ?? "");
  return (
    name.includes(t) ||
    sku.includes(t) ||
    idStr.includes(t) ||
    pid.includes(t)
  );
}

export interface SaleDetailModalProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  loading: boolean;
}

export function SaleDetailModal({ open, onClose, sale, loading }: SaleDetailModalProps) {
  const [lineQuery, setLineQuery] = useState("");

  useEffect(() => {
    if (!open) setLineQuery("");
  }, [open]);

  useEffect(() => {
    setLineQuery("");
  }, [sale?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filteredItems = useMemo(() => {
    if (!sale?.items?.length) return [];
    return sale.items.filter((line) => lineMatchesQuery(line, lineQuery));
  }, [sale?.items, lineQuery]);

  const lineCount = sale?.items?.length ?? 0;
  const showLineSearch = lineCount > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-detail-invoice"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[min(94vh,900px)] w-full flex-col overflow-hidden",
          "max-w-[calc(100vw-0.5rem)] sm:max-w-[min(96rem,calc(100vw-2rem))]",
          "rounded-t-xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/12",
          "sm:rounded-xl"
        )}
      >
        {/* Compact header — single toolbar */}
        <div className="relative shrink-0 border-b border-slate-800/60 bg-gradient-to-r from-slate-900 to-slate-800 px-2.5 py-2 text-white sm:px-3">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-blue-500/8 to-transparent" />
          <div className="relative flex items-center gap-2 sm:gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 sm:h-9 sm:w-9">
              <Receipt className="h-3.5 w-3.5 text-emerald-300 sm:h-4 sm:w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  Invoice
                </span>
                <h2
                  id="sale-detail-invoice"
                  className="min-w-0 truncate font-mono text-sm font-bold tracking-tight text-white sm:text-base"
                >
                  {sale?.invoiceNo ?? "—"}
                </h2>
                <span className="hidden h-3 w-px shrink-0 bg-white/20 sm:inline-block" aria-hidden />
                <div className="flex flex-wrap items-center gap-1">
                  {sale ? <StatusBadge status={sale.status} variant="soft" size="sm" /> : null}
                  {sale?.paymentMethod ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 ring-1 ring-white/10 sm:gap-1 sm:text-[11px]">
                      <CreditCard className="h-2.5 w-2.5 shrink-0 text-slate-400 sm:h-3 sm:w-3" aria-hidden />
                      {sale.paymentMethod}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-[10px] leading-tight text-slate-400 sm:text-[11px]">
                <span className="inline-flex min-w-0 items-center gap-0.5">
                  <User className="h-2.5 w-2.5 shrink-0 opacity-80 sm:h-3 sm:w-3" aria-hidden />
                  <span className="truncate font-medium text-slate-300">
                    {sale?.customerName ?? "—"}
                  </span>
                  {sale?.customerId != null ? (
                    <span className="shrink-0 tabular-nums text-slate-500">#{sale.customerId}</span>
                  ) : null}
                </span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                  <Calendar className="h-2.5 w-2.5 opacity-80 sm:h-3 sm:w-3" aria-hidden />
                  {sale ? formatSaleDate(sale.saleDate) : "—"}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md bg-white/10 p-1.5 text-white ring-1 ring-white/10 transition hover:bg-white/20 sm:p-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80">
          {loading && !sale ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-600">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading invoice…</p>
            </div>
          ) : sale ? (
            <div className="space-y-3 p-3 sm:p-4">
              {/* Amount summary */}
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Total (inc VAT)
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                    {formatCurrency(sale.grandTotal)}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80">
                    Paid
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-900 sm:text-xl">
                    {formatCurrency(sale.paidAmount)}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-lg border p-3 shadow-sm",
                    sale.dueAmount > 0
                      ? "border-amber-200/90 bg-amber-50/60"
                      : "border-slate-200/90 bg-white"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      sale.dueAmount > 0 ? "text-amber-900/80" : "text-slate-500"
                    )}
                  >
                    Due / on account
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-lg font-bold tabular-nums sm:text-xl",
                      sale.dueAmount > 0 ? "text-amber-950" : "text-slate-700"
                    )}
                  >
                    {formatCurrency(sale.dueAmount)}
                  </p>
                </div>
              </div>

              {/* Secondary figures */}
              <div className="grid gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Subtotal (ex VAT)" value={formatCurrency(sale.subtotal)} />
                <Stat label="VAT" value={formatCurrency(sale.taxAmount)} />
                <Stat label="Discount" value={formatCurrency(sale.discountAmount)} />
                <Stat
                  label="Change / return"
                  value={formatCurrency(sale.changeAmount)}
                  muted={sale.changeAmount === 0}
                />
              </div>

              {sale.note ? (
                <div className="flex gap-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Description / note
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-800">{sale.note}</p>
                  </div>
                </div>
              ) : null}

              {/* Line items */}
              <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Products</h3>
                      <p className="text-[11px] text-slate-500">
                        {lineCount} line{lineCount === 1 ? "" : "s"}
                        {lineQuery.trim()
                          ? ` · showing ${filteredItems.length} match${filteredItems.length === 1 ? "" : "es"}`
                          : null}
                      </p>
                    </div>
                  </div>
                  {showLineSearch ? (
                    <div className="relative w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={lineQuery}
                        onChange={(e) => setLineQuery(e.target.value)}
                        placeholder="Search product, code, ID…"
                        autoComplete="off"
                        className="h-9 w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="max-h-[min(52vh,480px)] overflow-auto lg:max-h-[min(56vh,520px)]">
                  <table className="w-full min-w-0 table-fixed text-left text-sm">
                    <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-white shadow-[0_1px_0_0_rgb(226_232_240)]">
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="w-[44%] px-3 py-2">Product</th>
                        <th className="w-[8%] px-2 py-2 text-right">Qty</th>
                        <th className="w-[16%] px-2 py-2 text-right">Ex VAT</th>
                        <th className="w-[14%] px-2 py-2 text-right">VAT</th>
                        <th className="w-[18%] px-3 py-2 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineCount === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                            No line items on this invoice.
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                            No products match “{lineQuery.trim()}”.{" "}
                            <button
                              type="button"
                              className="font-semibold text-blue-600 hover:underline"
                              onClick={() => setLineQuery("")}
                            >
                              Clear filter
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((line) => (
                          <tr
                            key={line.id}
                            className="bg-white transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-3 py-2 align-top">
                              <p className="break-words font-semibold leading-snug text-slate-900">
                                {line.productName ?? "—"}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                                {line.sku ? (
                                  <span className="font-mono tabular-nums">{line.sku}</span>
                                ) : null}
                                <span className="tabular-nums text-slate-400">
                                  #{line.productId}
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-slate-800">
                              {line.quantity}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums text-slate-700 sm:text-sm">
                              {formatCurrency(line.unitPrice)}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums text-slate-600 sm:text-sm">
                              {formatCurrency(line.taxAmount)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-bold tabular-nums text-slate-900">
                              {formatCurrency(line.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-slate-600">
                Could not load this invoice. Close and try again.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {sale ? (
          <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 sm:px-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printPosReceipt(buildPosReceiptSnapshotFromSale(sale))}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Print receipt
              </button>
              <Link
                href={`/sales/edit?saleId=${sale.id}`}
                onClick={onClose}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Edit sale
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("min-w-0 py-1", muted && "opacity-70")}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
