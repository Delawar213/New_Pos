"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { PageHeader, Modal, DecimalInput } from "@/components/ui";
import type {
  CreatePurchaseRequest,
  Purchase,
  PurchaseDetail,
  Product,
  UpdatePurchaseRequest,
} from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import {
  createPurchase,
  fetchPurchaseById,
  updatePurchase,
} from "@/store/slices/purchases/purchases.slice";
import { fetchAllProducts, fetchProductByBarcode } from "@/store/slices/product/product.slice";
import { fetchSuppliers, fetchSuppliersDropdown } from "@/store/slices/supplier/supplier.slice";
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
    vatRate: 0,
    sellingPriceExVat: 0,
    purchaseQuantity: 1,
  };
}

/** Line total ex VAT after per-unit discount. */
function lineNetExVat(d: PurchaseDetail): number {
  const qty = Number(d.purchaseQuantity || 0);
  const unitEx = Number(d.purchasePriceExVat || 0);
  const disc = Number(d.discountPerUnit || 0);
  return Math.max(0, qty * (unitEx - disc));
}

function lineVatAmount(d: PurchaseDetail): number {
  return lineNetExVat(d) * (Number(d.vatRate || 0) / 100);
}

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function purchaseDiscountAmount(
  subtotalExVat: number,
  mode: "percent" | "fixed",
  input: number
): number {
  if (subtotalExVat <= 0) return 0;
  if (mode === "percent") {
    const p = Math.max(0, input);
    return Math.min(subtotalExVat, subtotalExVat * (p / 100));
  }
  return Math.min(Math.max(0, input), subtotalExVat);
}

/** Value sent as `discountPercentage` on the API (header discount as % of line subtotal ex VAT). */
function apiDiscountPercentage(
  subtotalExVat: number,
  mode: "percent" | "fixed",
  input: number
): number {
  if (subtotalExVat <= 0) return 0;
  const discAmt = purchaseDiscountAmount(subtotalExVat, mode, input);
  const pct = (discAmt / subtotalExVat) * 100;
  return Math.round(pct * 10000) / 10000;
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
    ...(d.detailId != null && d.detailId > 0 ? { detailId: d.detailId } : {}),
    ...(d.purchaseDetailId != null && d.purchaseDetailId > 0
      ? { purchaseDetailId: d.purchaseDetailId }
      : {}),
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

function isoDateToInput(iso: string): string {
  if (!iso) return "";
  return iso.includes("T") ? (iso.split("T")[0] ?? "") : iso.slice(0, 10);
}

function mapApiPurchaseToForm(p: Purchase): FormValues {
  return {
    supplierId: p.supplierId,
    purchaseDate: isoDateToInput(p.purchaseDate),
    invoiceNumber: p.invoiceNumber ?? "",
    discountPercentage: p.discountPercentage ?? 0,
    description: p.description ?? "",
    notes: p.notes ?? "",
    purchaseDetails: (p.purchaseDetails ?? []).map((d) => ({
      detailId: d.detailId,
      purchaseDetailId: d.purchaseDetailId,
      productId: d.productId,
      barcode: d.barcode ?? "",
      batchNumber: d.batchNumber ?? "",
      expiryDate: d.expiryDate != null && d.expiryDate !== "" ? isoDateToInput(String(d.expiryDate)) : null,
      purchasePriceExVat: Number(d.purchasePriceExVat ?? 0),
      discountPerUnit: Number(d.discountPerUnit ?? 0),
      vatRate: Number(d.vatRate ?? 20),
      sellingPriceExVat: Number(d.sellingPriceExVat ?? 0),
      purchaseQuantity: Number(d.purchaseQuantity ?? 1),
    })),
  };
}

function NewPurchasePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const purchaseIdParam = searchParams.get("purchaseId");
  const editingId = useMemo(() => {
    if (!purchaseIdParam) return null;
    const n = Number(purchaseIdParam);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [purchaseIdParam]);
  const isEditing = editingId != null;

  const [hydratingEdit, setHydratingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { dropdownSuppliers, suppliers: suppliersFromList, loading: suppliersListLoading, dropdownFetchFailed } =
    useAppSelector((s) => s.supplier);
  const { allProducts, catalogLoading, barcodeLookupLoading } = useAppSelector((s) => s.product);

  useEffect(() => {
    void dispatch(fetchSuppliersDropdown());
    void dispatch(fetchSuppliers({ pageNumber: 1, pageSize: 100 }));
    void dispatch(fetchAllProducts());
  }, [dispatch]);

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    setHydratingEdit(true);
    void dispatch(fetchPurchaseById(editingId))
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        setForm(mapApiPurchaseToForm(res.data));
        setDiscountMode("percent");
        setDiscountInput(Number(res.data.discountPercentage ?? 0));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = typeof err === "string" ? err : "Failed to load purchase.";
        dispatch(
          addToast({
            type: "error",
            title: "Could not load purchase",
            message: msg,
            duration: 5000,
          })
        );
        router.replace("/purchases");
      })
      .finally(() => {
        if (!cancelled) setHydratingEdit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, editingId, router]);

  const suppliers = useMemo(
    () =>
      dropdownSuppliers.length > 0
        ? dropdownSuppliers
        : suppliersFromList.map((s) => ({
            supplierId: s.supplierId,
            supplierCode: s.supplierCode,
            supplierName: s.supplierName,
            currentBalance: s.currentBalance ?? 0,
          })),
    [dropdownSuppliers, suppliersFromList]
  );

  const products = allProducts;
  const productsLoading = catalogLoading || suppliersListLoading;

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
  const purchaseLineBatchRef = useRef<HTMLInputElement>(null);

  const focusNextAfterProductFound = useCallback(() => {
    requestAnimationFrame(() => {
      purchaseLineBatchRef.current?.focus();
    });
  }, []);

  const [form, setForm] = useState<FormValues>(() => ({
    supplierId: 0,
    purchaseDate: todayInputDate(),
    invoiceNumber: "",
    discountPercentage: 0,
    description: "",
    notes: "",
    purchaseDetails: [],
  }));

  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">("percent");
  const [discountInput, setDiscountInput] = useState(0);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PurchaseDetail>(() => emptyDetailRow());

  const draftLineTotals = useMemo(() => {
    const netExVat = lineNetExVat(draft);
    const vat = lineVatAmount(draft);
    return { netExVat, vat, totalIncVat: netExVat + vat };
  }, [draft]);

  const showLineTotal =
    draft.purchaseQuantity > 0 && Number(draft.purchasePriceExVat) > 0;

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
      vatRate: 0,
      sellingPriceExVat: p.sellingPrice,
      purchasePriceExVat: purchasePrice,
    }));
    requestAnimationFrame(() => {
      const el = purchaseLineBarcodeRef.current;
      if (el) el.value = barcodeVal || p.barcode || "";
    });
    focusNextAfterProductFound();
  }, [focusNextAfterProductFound]);

  const applyProductToDraft = (productId: number) => {
    setBarcodeResolvedProduct(null);
    if (!productId) {
      setDraft((d) => ({ ...d, productId: 0, barcode: "" }));
      requestAnimationFrame(() => {
        if (purchaseLineBarcodeRef.current) purchaseLineBarcodeRef.current.value = "";
      });
      return;
    }
    const p = allProducts.find((x: Product) => x.productId === productId);
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
        const p = await dispatch(fetchProductByBarcode(code)).unwrap();
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
    [products, mergeProductIntoDraft, dispatch, barcodeLookupLoading]
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
    if (p) return `${p.productCode} — ${p.productName}`;
    if (d.productName) return d.productName;
    return `Product #${d.productId}`;
  };

  const purchaseTotals = useMemo(() => {
    const details = form.purchaseDetails.filter((d) => d.productId > 0 && d.purchaseQuantity > 0);
    const itemsSubtotalExVat = details.reduce((s, d) => s + lineNetExVat(d), 0);
    const itemsVatBeforeHeader = details.reduce((s, d) => s + lineVatAmount(d), 0);
    const headerDisc = purchaseDiscountAmount(itemsSubtotalExVat, discountMode, discountInput);
    const netExVat = itemsSubtotalExVat - headerDisc;
    const ratio = itemsSubtotalExVat > 0 ? netExVat / itemsSubtotalExVat : 0;
    const totalVat = itemsVatBeforeHeader * ratio;
    const grandTotal = netExVat + totalVat;
    const totalQty = details.reduce((s, d) => s + Number(d.purchaseQuantity || 0), 0);
    return {
      itemsSubtotalExVat,
      headerDisc,
      netExVat,
      totalVat,
      grandTotal,
      lineCount: details.length,
      totalQty,
    };
  }, [form.purchaseDetails, discountMode, discountInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hydratingEdit) return;

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

    const linesSubtotal = validDetails.reduce((s, d) => s + lineNetExVat(d), 0);
    const discountPercentage = apiDiscountPercentage(linesSubtotal, discountMode, discountInput);

    const basePayload = {
      supplierId: form.supplierId,
      purchaseDate: form.purchaseDate,
      invoiceNumber: form.invoiceNumber.trim(),
      discountPercentage,
      description: form.description?.trim() || "",
      notes: form.notes?.trim() || "",
      createdBy: CREATED_BY,
      purchaseDetails: validDetails.map(toApiPurchaseDetail),
    };

    setSubmitting(true);
    try {
      if (isEditing && editingId != null) {
        const updatePayload: UpdatePurchaseRequest = {
          purchaseId: editingId,
          ...basePayload,
        };
        const result = await dispatch(updatePurchase(updatePayload));
        if (updatePurchase.rejected.match(result)) {
          dispatch(
            addToast({
              type: "error",
              title: "Could not update purchase",
              message: result.payload || "Request failed.",
            })
          );
          return;
        }
        if (updatePurchase.fulfilled.match(result)) {
          dispatch(
            addToast({
              type: "success",
              title: "Purchase updated",
              message: result.payload.message || "Saved successfully.",
            })
          );
          router.push("/purchases");
        }
        return;
      }

      const payload: CreatePurchaseRequest = basePayload;
      const result = await dispatch(createPurchase(payload));
      if (createPurchase.rejected.match(result)) {
        dispatch(
          addToast({
            type: "error",
            title: "Could not create purchase",
            message: result.payload || "Request failed.",
          })
        );
        return;
      }

      if (!createPurchase.fulfilled.match(result)) {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.debug("[createPurchase] response body:", result.payload);
      }

      const outcome = interpretCreatePurchaseResponse(result.payload);
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? "Edit purchase" : "New purchase"}
        description={
          isEditing
            ? "Update this purchase order and its line items"
            : "Create a purchase order with line items"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchases", href: "/purchases" },
          { label: isEditing ? "Edit" : "New" },
        ]}
      />

      <form
        onSubmit={handleSubmit}
        className="relative space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {hydratingEdit && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px]">
            <p className="text-sm font-medium text-gray-600">Loading purchase…</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
            {dropdownFetchFailed && suppliers.length > 0 && (
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
            <p className="mt-1 text-xs text-gray-500">Defaults to today; change if needed.</p>
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
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Line net (ex VAT)</th>
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
                        {formatCurrency(lineNetExVat(row))}
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
                {form.purchaseDetails.length > 0 && (
                  <tfoot className="border-t border-slate-200 bg-slate-50/90">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-slate-600">
                        {purchaseTotals.lineCount} line{purchaseTotals.lineCount !== 1 ? "s" : ""} ·{" "}
                        {purchaseTotals.totalQty} units
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-right text-sm text-slate-500">
                        Subtotal (ex VAT)
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(purchaseTotals.itemsSubtotalExVat)}
                      </td>
                      <td className="px-3 py-2" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">Purchase discount</p>
          <p className="mb-3 text-xs text-slate-500">
            Applied to the line subtotal (after per-line unit discounts). Choose percentage or a fixed amount.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[160px] flex-1">
              <label htmlFor="purchase-discount-type" className="mb-1 block text-xs font-medium text-slate-600">
                Discount type
              </label>
              <select
                id="purchase-discount-type"
                value={discountMode}
                onChange={(e) => {
                  const m = e.target.value as "percent" | "fixed";
                  setDiscountMode(m);
                  setDiscountInput(0);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label htmlFor="purchase-discount-value" className="mb-1 block text-xs font-medium text-slate-600">
                {discountMode === "percent" ? "Discount (%)" : "Discount amount"}
              </label>
              <input
                id="purchase-discount-value"
                type="number"
                step="0.01"
                min={0}
                max={discountMode === "percent" ? 100 : undefined}
                value={discountInput}
                onChange={(e) => setDiscountInput(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/40 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Order summary</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 rounded-lg bg-white/80 px-3 py-2">
              <dt className="text-slate-600">Lines subtotal (ex VAT)</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(purchaseTotals.itemsSubtotalExVat)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 rounded-lg bg-white/80 px-3 py-2">
              <dt className="text-slate-600">
                Purchase discount
                {discountMode === "percent" ? ` (${discountInput}%)` : ""}
              </dt>
              <dd className="font-semibold tabular-nums text-rose-600">
                −{formatCurrency(purchaseTotals.headerDisc)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 rounded-lg bg-white/80 px-3 py-2">
              <dt className="text-slate-600">Net (ex VAT)</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(purchaseTotals.netExVat)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 rounded-lg bg-white/80 px-3 py-2">
              <dt className="text-slate-600">VAT (proportional)</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(purchaseTotals.totalVat)}
              </dd>
            </div>
            <div className="sm:col-span-2 flex justify-between gap-4 rounded-lg border border-blue-200 bg-white px-3 py-3">
              <dt className="text-base font-semibold text-slate-800">Estimated total (inc VAT)</dt>
              <dd className="text-base font-bold tabular-nums text-blue-700">
                {formatCurrency(purchaseTotals.grandTotal)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-slate-500">
            Summary is for reference; the server may recalculate tax totals from line VAT rates.
          </p>
        </div>

        <div>
          <label htmlFor="purchase-desc" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="purchase-desc"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label htmlFor="purchase-notes" className="mb-1 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="purchase-notes"
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
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
            disabled={submitting || hydratingEdit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Save purchase"}
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
        size="xl"
        scrollableContent={false}
        footer={
          <div className="w-full space-y-3">
            {showLineTotal ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                      Line total
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">
                      {draft.purchaseQuantity} × {formatCurrency(draft.purchasePriceExVat)}
                      {draft.discountPerUnit > 0
                        ? ` − ${formatCurrency(draft.discountPerUnit)} disc./unit`
                        : ""}
                      <span className="mx-2 text-blue-400">·</span>
                      Ex VAT {formatCurrency(draftLineTotals.netExVat)}
                      {draft.vatRate > 0
                        ? ` · VAT ${formatCurrency(draftLineTotals.vat)}`
                        : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-xl font-bold tabular-nums text-blue-950">
                    {formatCurrency(draftLineTotals.totalIncVat)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500">
                Enter quantity and purchase price to see the line total.
              </p>
            )}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                ref={purchaseLineBatchRef}
                value={draft.batchNumber || ""}
                onChange={(e) => setDraft((d) => ({ ...d, batchNumber: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Quantity *</label>
              <DecimalInput
                integer
                min={1}
                emptyWhenZero={false}
                value={draft.purchaseQuantity}
                onChange={(purchaseQuantity) =>
                  setDraft((d) => ({ ...d, purchaseQuantity: purchaseQuantity || 1 }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Purchase price (ex VAT)
              </label>
              <DecimalInput
                value={draft.purchasePriceExVat}
                onChange={(purchasePriceExVat) =>
                  setDraft((d) => ({ ...d, purchasePriceExVat }))
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Discount / unit</label>
              <DecimalInput
                value={draft.discountPerUnit}
                onChange={(discountPerUnit) => setDraft((d) => ({ ...d, discountPerUnit }))}
                placeholder="0.00"
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
              <DecimalInput
                value={draft.sellingPriceExVat}
                onChange={(sellingPriceExVat) =>
                  setDraft((d) => ({ ...d, sellingPriceExVat }))
                }
                placeholder="0.00"
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

export default function NewPurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <NewPurchasePageContent />
    </Suspense>
  );
}
