"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { PageHeader, Modal } from "@/components/ui";
import type { CreatePurchaseRequest, PurchaseDetail, Product } from "@/types";
import {
  useCreatePurchaseMutation,
  useGetAllProductsQuery,
  useGetSuppliersDropdownQuery,
  useGetSuppliersQuery,
} from "@/store/api";
import { useLazyGetProductByBarcodeQuery } from "@/store/api/productsApi";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { cn, formatCurrency } from "@/lib/utils";

const VAT_RATE_OPTIONS = [0, 5, 20] as const;

/** No auth; API expects a string user id for `createdBy`. */
const CREATED_BY = "1";

type SelectOption = { id: number; label: string; search: string };

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  emptyHint,
}: {
  options: SelectOption[];
  value: number;
  onChange: (id: number) => void;
  placeholder: string;
  disabled?: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.search.includes(q));
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm",
          disabled && "cursor-not-allowed opacity-60",
          !selected && "text-gray-500"
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyHint ?? "No matches"}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      onChange(o.id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function emptyDetailRow(): PurchaseDetail {
  return {
    productId: 0,
    barcode: "",
    batchNumber: "",
    expiryDate: null,
    purchasePriceExVat: 0,
    discountPerUnit: 0,
    vatRate: 20,
    sellingPriceExVat: 0,
    purchaseQuantity: 1,
  };
}

function lineExVatTotal(d: PurchaseDetail): number {
  const qty = Number(d.purchaseQuantity || 0);
  const unit = Number(d.purchasePriceExVat || 0);
  return qty * unit;
}

function formatRequestError(err: unknown): string {
  if (typeof err !== "object" || err === null) return "Request failed.";
  const e = err as Record<string, unknown>;
  const data = e.data as Record<string, unknown> | undefined;
  if (typeof data?.message === "string" && data.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map(String).join(" ");
  }
  if (typeof e.error === "string" && e.error) return e.error;
  if (typeof e.status === "number") return `Server responded with ${e.status}.`;
  if (typeof e.status === "string" && e.status !== "PARSING_ERROR") return e.status;
  return "Request failed. Check network and API configuration.";
}

function isSuccessFlag(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

function isFailureFlag(v: unknown): boolean {
  return v === false || v === "false" || v === 0;
}

function mergeErrLists(base: string[], extra: unknown): string[] {
  if (!Array.isArray(extra)) return base;
  return [...base, ...extra.map(String)];
}

function pickPurchaseId(ent: Record<string, unknown>): unknown {
  return (
    ent.purchaseId ??
    ent.PurchaseId ??
    ent.purchaseID ??
    ent.PurchaseID
  );
}

function hasPurchaseId(ent: Record<string, unknown>): boolean {
  const idRaw = pickPurchaseId(ent);
  return idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== "";
}

/**
 * Normalizes create-purchase JSON (.NET often uses PascalCase; envelopes may nest `data` several times).
 */
function extractCreatedPurchaseEntity(raw: unknown): {
  success: unknown;
  message: string;
  errors: string[];
  entity: Record<string, unknown> | null;
} {
  const empty = {
    success: undefined as unknown,
    message: "",
    errors: [] as string[],
    entity: null as Record<string, unknown> | null,
  };

  if (!raw || typeof raw !== "object") {
    return { ...empty, message: "Empty response from server." };
  }

  const top = raw as Record<string, unknown>;
  let success: unknown = top.success ?? top.Success;
  let message =
    (typeof top.message === "string" && top.message) ||
    (typeof top.Message === "string" && top.Message) ||
    "";
  let errors = mergeErrLists([], top.errors);
  errors = mergeErrLists(errors, top.Errors);

  if (hasPurchaseId(top)) {
    return { success, message, errors, entity: top };
  }

  let cursor: unknown = top.data ?? top.Data;
  let depth = 0;
  while (cursor && typeof cursor === "object" && depth < 8) {
    if (Array.isArray(cursor)) {
      for (const item of cursor) {
        if (item && typeof item === "object" && !Array.isArray(item) && hasPurchaseId(item as Record<string, unknown>)) {
          return { success, message, errors, entity: item as Record<string, unknown> };
        }
      }
      break;
    }

    const c = cursor as Record<string, unknown>;
    if (hasPurchaseId(c)) {
      return { success, message, errors, entity: c };
    }

    const inner = c.data ?? c.Data;
    if (inner === undefined || inner === null) {
      break;
    }

    if (c.success !== undefined) success = c.success;
    if (c.Success !== undefined) success = c.Success;
    if (typeof c.message === "string" && c.message) message = c.message;
    if (typeof c.Message === "string" && c.Message) message = c.Message;
    errors = mergeErrLists(errors, c.errors);
    errors = mergeErrLists(errors, c.Errors);

    cursor = inner;
    depth++;
  }

  return { success, message, errors, entity: null };
}

function interpretCreatePurchaseResponse(raw: unknown): {
  ok: boolean;
  title: string;
  message: string;
} {
  const { success, message, errors, entity } = extractCreatedPurchaseEntity(raw);
  const errText = errors.filter(Boolean).join(" ").trim();

  if (entity) {
    const idRaw = entity.purchaseId ?? entity.PurchaseId;
    const idNum = typeof idRaw === "number" ? idRaw : Number(idRaw);
    if (!Number.isFinite(idNum) || idNum < 1) {
      return {
        ok: false,
        title: "Purchase not saved",
        message: "The API returned an invalid purchase id. Check the backend and database.",
      };
    }
    if (isFailureFlag(success)) {
      return {
        ok: false,
        title: "Purchase not saved",
        message: errText || message || "Server reported failure.",
      };
    }
    const codeRaw = entity.purchaseCode ?? entity.PurchaseCode;
    const codeStr = typeof codeRaw === "string" && codeRaw ? ` ${codeRaw}` : "";
    return {
      ok: true,
      title: "Purchase created",
      message: [message || "Saved successfully.", codeStr && `Ref:${codeStr}`, `(id ${idNum})`]
        .filter(Boolean)
        .join(" ")
        .trim(),
    };
  }

  if (isFailureFlag(success)) {
    return {
      ok: false,
      title: "Purchase not saved",
      message: errText || message || "Server reported failure.",
    };
  }

  if (isSuccessFlag(success)) {
    const apiMsg = message.trim();
    const vague = !apiMsg || /^success$/i.test(apiMsg);
    const detail = errText || (!vague ? message : "");
    return {
      ok: false,
      title: "Save not confirmed",
      message:
        detail ||
        "The server said success but the response had no purchase id we could read (check PascalCase Data / PurchaseId, or nested data). Open DevTools → Network → POST purchases → Response. If the id is there, tell us the JSON shape.",
    };
  }

  return {
    ok: false,
    title: "Purchase not saved",
    message: errText || message || "Unexpected response from server.",
  };
}

type FormValues = Omit<CreatePurchaseRequest, "createdBy" | "purchaseDetails"> & {
  purchaseDetails: PurchaseDetail[];
};

function toApiPurchaseDetail(d: PurchaseDetail) {
  return {
    productId: d.productId,
    barcode: d.barcode ?? "",
    batchNumber: d.batchNumber ?? "",
    expiryDate: d.expiryDate ?? null,
    purchasePriceExVat: Number(d.purchasePriceExVat),
    discountPerUnit: Number(d.discountPerUnit),
    vatRate: Number(d.vatRate),
    sellingPriceExVat: Number(d.sellingPriceExVat),
    purchaseQuantity: Number(d.purchaseQuantity),
  };
}

export default function NewPurchasePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();

  const {
    data: suppliersDropdown = [],
    isError: isSuppliersDropdownError,
  } = useGetSuppliersDropdownQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: suppliersListResponse } = useGetSuppliersQuery(
    { pageNumber: 1, pageSize: 100 },
    { refetchOnMountOrArgChange: true }
  );
  const { data: products = [], isLoading: productsLoading } = useGetAllProductsQuery();
  const [lookupProductByBarcode, { isFetching: barcodeLookupLoading }] =
    useLazyGetProductByBarcodeQuery();

  const suppliers = useMemo(
    () =>
      suppliersDropdown.length > 0
        ? suppliersDropdown
        : (suppliersListResponse?.data.data || []).map((s) => ({
            supplierId: s.supplierId,
            supplierCode: s.supplierCode,
            supplierName: s.supplierName,
            currentBalance: s.currentBalance ?? 0,
          })),
    [suppliersDropdown, suppliersListResponse]
  );

  const supplierOptions: SelectOption[] = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.supplierId,
        label: `${s.supplierCode} — ${s.supplierName}`,
        search: `${s.supplierCode} ${s.supplierName}`.toLowerCase(),
      })),
    [suppliers]
  );

  const productOptions: SelectOption[] = useMemo(
    () =>
      products.map((p: Product) => ({
        id: p.productId,
        label: `${p.productCode} — ${p.productName}`,
        search: `${p.productCode} ${p.productName} ${p.barcode ?? ""}`.toLowerCase(),
      })),
    [products]
  );

  /** Product returned from barcode API may not be in the paged `products` list — inject for the select. */
  const [barcodeResolvedProduct, setBarcodeResolvedProduct] = useState<Product | null>(null);

  const productOptionsForSelect = useMemo(() => {
    const list = [...productOptions];
    if (
      barcodeResolvedProduct &&
      !list.some((o) => o.id === barcodeResolvedProduct.productId)
    ) {
      const p = barcodeResolvedProduct;
      list.push({
        id: p.productId,
        label: `${p.productCode} — ${p.productName}`,
        search: `${p.productCode} ${p.productName} ${p.barcode ?? ""}`.toLowerCase(),
      });
    }
    return list;
  }, [productOptions, barcodeResolvedProduct]);

  const [lineModalMountKey, setLineModalMountKey] = useState(0);
  const purchaseLineBarcodeRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormValues>(() => ({
    supplierId: 0,
    purchaseDate: "",
    invoiceNumber: "",
    discountPercentage: 0,
    description: "",
    notes: "",
    purchaseDetails: [],
  }));

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PurchaseDetail>(() => emptyDetailRow());

  const openAddLineModal = () => {
    setEditingIndex(null);
    setDraft(emptyDetailRow());
    setBarcodeResolvedProduct(null);
    setLineModalMountKey((k) => k + 1);
    setLineModalOpen(true);
  };

  const openEditLineModal = (index: number) => {
    const row = form.purchaseDetails[index];
    if (!row) return;
    setEditingIndex(index);
    setDraft({ ...row });
    setBarcodeResolvedProduct(null);
    setLineModalMountKey((k) => k + 1);
    setLineModalOpen(true);
  };

  const mergeProductIntoDraft = useCallback((p: Product, scannedBarcode?: string) => {
    const purchasePrice =
      p.lastPurchasePrice != null && p.lastPurchasePrice > 0
        ? p.lastPurchasePrice
        : p.costPrice != null && p.costPrice > 0
          ? p.costPrice
          : 0;
    const barcodeVal = (scannedBarcode?.trim() || p.barcode || "").trim();
    setDraft((d) => ({
      ...d,
      productId: p.productId,
      barcode: barcodeVal || d.barcode || "",
      vatRate: p.vatRate,
      sellingPriceExVat: p.sellingPrice,
      purchasePriceExVat: purchasePrice,
    }));
    requestAnimationFrame(() => {
      const el = purchaseLineBarcodeRef.current;
      if (el) el.value = barcodeVal || p.barcode || "";
    });
  }, []);

  const applyProductToDraft = (productId: number) => {
    setBarcodeResolvedProduct(null);
    if (!productId) {
      setDraft((d) => ({ ...d, productId: 0, barcode: "" }));
      requestAnimationFrame(() => {
        if (purchaseLineBarcodeRef.current) purchaseLineBarcodeRef.current.value = "";
      });
      return;
    }
    const p = products.find((x: Product) => x.productId === productId);
    if (!p) return;
    mergeProductIntoDraft(p);
  };

  const resolveBarcodeToProduct = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code || barcodeLookupLoading) return;

      const local = products.find(
        (p: Product) => (p.barcode ?? "").trim().toLowerCase() === code.toLowerCase()
      );
      if (local) {
        setBarcodeResolvedProduct(null);
        mergeProductIntoDraft(local, code);
        dispatch(
          addToast({
            type: "success",
            title: "Product found",
            message: local.productName,
            duration: 2500,
          })
        );
        return;
      }

      try {
        const p = await lookupProductByBarcode(code).unwrap();
        setBarcodeResolvedProduct(p);
        mergeProductIntoDraft(p, code);
        dispatch(
          addToast({
            type: "success",
            title: "Product found",
            message: p.productName,
            duration: 2500,
          })
        );
      } catch {
        dispatch(
          addToast({
            type: "error",
            title: "Barcode not found",
            message: `No product matches “${code}”.`,
            duration: 4000,
          })
        );
      }
    },
    [
      products,
      lookupProductByBarcode,
      mergeProductIntoDraft,
      dispatch,
      barcodeLookupLoading,
    ]
  );

  useEffect(() => {
    if (!lineModalOpen) return;
    const t = window.setTimeout(() => {
      purchaseLineBarcodeRef.current?.focus();
      purchaseLineBarcodeRef.current?.select();
    }, 100);
    return () => clearTimeout(t);
  }, [lineModalOpen, lineModalMountKey]);

  const commitLineFromModal = () => {
    const barcodeLive = String(
      purchaseLineBarcodeRef.current?.value ?? draft.barcode ?? ""
    ).trim();
    const line = { ...draft, barcode: barcodeLive };

    if (!line.productId || line.purchaseQuantity <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Line incomplete",
          message: "Choose a product and enter a quantity greater than zero.",
        })
      );
      return;
    }
    if (editingIndex === null) {
      setForm((prev) => ({
        ...prev,
        purchaseDetails: [...prev.purchaseDetails, line],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        purchaseDetails: prev.purchaseDetails.map((row, i) =>
          i === editingIndex ? line : row
        ),
      }));
    }
    setLineModalOpen(false);
    setEditingIndex(null);
    setDraft(emptyDetailRow());
  };

  const removeLine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      purchaseDetails: prev.purchaseDetails.filter((_, i) => i !== index),
    }));
  };

  const productLabel = (d: PurchaseDetail) => {
    const p = products.find((x: Product) => x.productId === d.productId);
    return p ? `${p.productCode} — ${p.productName}` : `Product #${d.productId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDetails = form.purchaseDetails.filter(
      (d) => d.productId > 0 && d.purchaseQuantity > 0
    );
    if (
      !form.purchaseDate ||
      !form.invoiceNumber.trim() ||
      form.supplierId <= 0 ||
      validDetails.length === 0
    ) {
      dispatch(
        addToast({
          type: "warning",
          title: "Check required fields",
          message: "Supplier, date, invoice, and at least one line item are required.",
        })
      );
      return;
    }

    const payload: CreatePurchaseRequest = {
      supplierId: form.supplierId,
      purchaseDate: form.purchaseDate,
      invoiceNumber: form.invoiceNumber.trim(),
      discountPercentage: Number(form.discountPercentage),
      description: form.description?.trim() || "",
      notes: form.notes?.trim() || "",
      createdBy: CREATED_BY,
      purchaseDetails: validDetails.map(toApiPurchaseDetail),
    };

    const result = await createPurchase(payload);
    if ("error" in result) {
      dispatch(
        addToast({
          type: "error",
          title: "Could not create purchase",
          message: formatRequestError(result.error),
        })
      );
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[createPurchase] response body:", result.data);
    }

    const outcome = interpretCreatePurchaseResponse(result.data);
    if (!outcome.ok) {
      dispatch(
        addToast({
          type: "error",
          title: outcome.title,
          message: outcome.message,
        })
      );
      return;
    }

    dispatch(
      addToast({
        type: "success",
        title: outcome.title,
        message: outcome.message,
      })
    );
    router.push("/purchases");
  };

  return (
    <div>
      <PageHeader
        title="New purchase"
        description="Create a purchase order with line items"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchases", href: "/purchases" },
          { label: "New" },
        ]}
      />

      <div className="mb-4">
        <Link
          href="/purchases"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to purchases
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
            {isSuppliersDropdownError && suppliers.length > 0 && (
              <p className="mb-1 text-xs text-amber-600">
                Dropdown endpoint unavailable; using supplier list.
              </p>
            )}
            <SearchableSelect
              options={supplierOptions}
              value={form.supplierId}
              onChange={(id) => setForm({ ...form, supplierId: id })}
              placeholder="Search and select supplier…"
              disabled={suppliers.length === 0}
              emptyHint="No suppliers loaded"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Purchase date *
            </label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Invoice number *
            </label>
            <input
              value={form.invoiceNumber}
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Discount %
            </label>
            <select
              value={form.discountPercentage}
              onChange={(e) =>
                setForm({ ...form, discountPercentage: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {[0, 5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>
                  {n}%
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Line items</p>
              <p className="text-xs text-gray-500">
                Add products in the dialog, then review or edit rows here.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddLineModal}
              disabled={productsLoading || products.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              + Add line item
            </button>
          </div>
          {productsLoading && (
            <p className="mb-2 text-xs text-gray-500">Loading products…</p>
          )}
          {!productsLoading && products.length === 0 && (
            <p className="text-sm text-amber-700">No products available to add.</p>
          )}

          {form.purchaseDetails.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 py-10 text-center text-sm text-gray-500">
              No lines yet. Click &quot;Add line item&quot; to add products.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Barcode</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Batch</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Buy ex VAT</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">VAT %</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Sell ex VAT</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Line ex VAT</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {form.purchaseDetails.map((row, index) => (
                    <tr key={`${row.productId}-${index}`}>
                      <td className="max-w-[200px] truncate px-3 py-2 text-gray-900">
                        {productLabel(row)}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.barcode || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{row.batchNumber || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.purchaseQuantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(row.purchasePriceExVat)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.vatRate}%</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(row.sellingPriceExVat)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                        {formatCurrency(lineExVatTotal(row))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openEditLineModal(index)}
                          className="mr-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/purchases"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>

      <Modal
        open={lineModalOpen}
        onClose={() => {
          setLineModalOpen(false);
          setEditingIndex(null);
          setDraft(emptyDetailRow());
          setBarcodeResolvedProduct(null);
        }}
        title={editingIndex === null ? "Add line item" : "Edit line item"}
        description="Search for a product, adjust quantities and pricing, then add to this purchase."
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setLineModalOpen(false);
                setEditingIndex(null);
                setDraft(emptyDetailRow());
                setBarcodeResolvedProduct(null);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitLineFromModal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editingIndex === null ? "Add to purchase" : "Update line"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product *</label>
            <SearchableSelect
              options={productOptionsForSelect}
              value={draft.productId}
              onChange={applyProductToDraft}
              placeholder="Search product by code, name, or barcode…"
              disabled={productsLoading || products.length === 0}
              emptyHint="No products match"
            />
            <p className="text-xs text-gray-500">
              Tip: scan a barcode in the field below — the product name above updates when the code matches.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Barcode {barcodeLookupLoading ? "(looking up…)" : ""}
              </label>
              <input
                key={lineModalMountKey}
                ref={purchaseLineBarcodeRef}
                id="purchase-line-barcode"
                defaultValue={draft.barcode || ""}
                onInput={(e) => {
                  const v = (e.currentTarget as HTMLInputElement).value;
                  setDraft((d) => (d.barcode === v ? d : { ...d, barcode: v }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const v = (e.currentTarget as HTMLInputElement).value;
                    void resolveBarcodeToProduct(v);
                  }
                }}
                autoComplete="off"
                spellCheck={false}
                disabled={barcodeLookupLoading}
                placeholder="Scan or type barcode, then Enter / Tab"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Batch number</label>
              <input
                value={draft.batchNumber || ""}
                onChange={(e) => setDraft((d) => ({ ...d, batchNumber: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Quantity *</label>
              <input
                type="number"
                min={1}
                value={draft.purchaseQuantity}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    purchaseQuantity: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Purchase price (ex VAT)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={draft.purchasePriceExVat}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    purchasePriceExVat: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Discount / unit</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={draft.discountPerUnit}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    discountPerUnit: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">VAT %</label>
              <select
                value={draft.vatRate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, vatRate: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {VAT_RATE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Selling price (ex VAT)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={draft.sellingPriceExVat}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    sellingPriceExVat: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Expiry date</label>
              <input
                type="date"
                value={draft.expiryDate || ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    expiryDate: e.target.value || null,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
