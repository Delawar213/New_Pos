"use client";

// ============================================
// Products Page - Modern Product Management
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Edit2,
  Trash2,
  Eye,
  TrendingUp,
  AlertTriangle,
  Archive,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Modal,
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Product, CreateProductRequest, UpdateProductRequest } from "@/types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearProductState,
} from "@/store/slices/product/product.slice";
import { fetchCategories } from "@/store/slices/category/category.slice";
import { fetchBrands } from "@/store/slices/brand/brand.slice";
import { fetchSubCategories } from "@/store/slices/subCategory/subCategory.slice";
import { addToast } from "@/store/slices/ui/ui.slice";

function suggestNextProductCode(products: Product[], totalRecords: number): string {
  let maxNum = 0;
  const re = /^PRD(\d+)$/i;
  for (const p of products) {
    const m = p.productCode?.trim().match(re);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  maxNum = Math.max(maxNum, totalRecords);
  return `PRD${String(maxNum + 1).padStart(3, "0")}`;
}

const emptyForm = (): CreateProductRequest => ({
  productCode: "",
  productName: "",
  barcode: "",
  description: "",
  categoryId: 0,
  subCategoryId: null,
  brandId: 0,
  unitOfMeasurement: "Each",
  sellingPriceExVat: 0,
  vatRate: 20,
  stockAlertLevel: 10,
  reorderLevel: 20,
  isActive: true,
});

/** Typical grocery / retail units — searchable in the product form. */
const GROCERY_UNITS_OF_MEASUREMENT = [
  "Each",
  "Piece",
  "Pack",
  "Box",
  "Case",
  "Carton",
  "Tray",
  "Bottle",
  "Can",
  "Jar",
  "Tin",
  "Tube",
  "Pouch",
  "Bag",
  "Sachet",
  "Net bag",
  "Bunch",
  "Head",
  "Loaf",
  "Slice",
  "Portion",
  "Roll",
  "Dozen",
  "Pair",
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "cl",
  "Pint",
  "Fl oz",
] as const;

const VAT_RATE_OPTIONS = [0, 5, 20] as const;

function buildUomSelectOptions(currentUom: string): SearchableSelectOption<string>[] {
  const base: SearchableSelectOption<string>[] = GROCERY_UNITS_OF_MEASUREMENT.map((u) => ({
    value: u,
    label: u,
    search: u.toLowerCase(),
  }));
  const t = currentUom.trim();
  if (t && !(GROCERY_UNITS_OF_MEASUREMENT as readonly string[]).includes(t)) {
    return [{ value: t, label: `${t} (from product)`, search: t.toLowerCase() }, ...base];
  }
  return base;
}

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const {
    products,
    loading,
    actionLoading,
    error,
    success,
    message,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
  } = useAppSelector((s) => s.product);
  const { categories } = useAppSelector((s) => s.category);
  const { brands } = useAppSelector((s) => s.brand);
  const { subCategories } = useAppSelector((s) => s.subCategory);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductRequest>(emptyForm());
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);

  const commitBarcodeValue = useCallback((value: string) => {
    setForm((f) => ({ ...f, barcode: value }));
    const el = barcodeInputRef.current;
    if (el) el.value = value;
  }, []);

  /**
   * Focus barcode after the dialog paints. Scanners need a real focused input; Notepad works because it always has focus.
   */
  useEffect(() => {
    if (!modalOpen) return;
    const t = window.setTimeout(() => {
      const el = barcodeInputRef.current;
      el?.focus();
      el?.select();
    }, 100);
    return () => clearTimeout(t);
  }, [modalOpen]);

  /**
   * USB scanners = very fast "keyboard" + suffix (Enter or Tab). React controlled inputs often drop characters; the barcode field is uncontrolled (native buffer).
   * When focus is on a button/select/checkbox, capture the stream here and write into the barcode field.
   */
  useEffect(() => {
    if (!modalOpen) return;

    let buffer = "";
    let lastKeyAt = 0;
    let flushTimer: ReturnType<typeof setTimeout> | undefined;

    const clearBuffer = () => {
      buffer = "";
    };

    const useGlobalScanBuffer = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return true;
      const tag = target.tagName;
      if (tag === "TEXTAREA") return false;
      if (tag === "INPUT") {
        const inp = target as HTMLInputElement;
        if (inp.id === "prod-barcode") return false;
        const textLike =
          inp.type === "text" ||
          inp.type === "search" ||
          inp.type === "number" ||
          inp.type === "email" ||
          inp.type === "url" ||
          inp.type === "tel" ||
          inp.type === "";
        if (textLike) return false;
      }
      return true;
    };

    const finishScan = () => {
      if (buffer.length < 1) return;
      const v = buffer;
      buffer = "";
      if (flushTimer) clearTimeout(flushTimer);
      commitBarcodeValue(v);
      window.requestAnimationFrame(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!useGlobalScanBuffer(e.target)) return;

      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.length >= 1) {
          e.preventDefault();
          e.stopPropagation();
          finishScan();
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = performance.now();
        if (now - lastKeyAt > 200) buffer = "";
        buffer += e.key;
        lastKeyAt = now;
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(clearBuffer, 300);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (flushTimer) clearTimeout(flushTimer);
    };
  }, [modalOpen, commitBarcodeValue]);

  useEffect(() => {
    dispatch(fetchCategories({ pageNumber: 1, pageSize: 200 }));
    dispatch(fetchBrands({ pageNumber: 1, pageSize: 200 }));
    dispatch(fetchSubCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts(buildPagedFetchArgs(currentPage, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, currentPage, pageSize]);

  const refreshProductList = () =>
    dispatch(
      fetchProducts({
        pageNumber: currentPage,
        pageSize,
        searchTerm: debouncedSearch.trim() || undefined,
        sortDirection: "desc",
      })
    );

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearProductState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearProductState());
    }
  }, [success, error, message, dispatch]);

  const filteredSubCategories = useMemo(
    () => subCategories.filter((s) => s.categoryId === form.categoryId),
    [subCategories, form.categoryId]
  );

  const categoryOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      categories.map((c) => ({
        value: c.categoryId,
        label: c.categoryName,
        search: c.categoryName.toLowerCase(),
      })),
    [categories]
  );

  const subCategoryOptions: SearchableSelectOption<number>[] = useMemo(() => {
    const none: SearchableSelectOption<number> = {
      value: 0,
      label: "None",
      search: "none no subcategory",
    };
    const rest = filteredSubCategories.map((s) => ({
      value: s.subCategoryId,
      label: s.subCategoryName,
      search: s.subCategoryName.toLowerCase(),
    }));
    return [none, ...rest];
  }, [filteredSubCategories]);

  const brandOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      brands.map((b) => ({
        value: b.brandId,
        label: b.brandName,
        search: b.brandName.toLowerCase(),
      })),
    [brands]
  );

  const uomOptions = useMemo(
    () => buildUomSelectOptions(form.unitOfMeasurement),
    [form.unitOfMeasurement]
  );

  const vatOptions: SearchableSelectOption<number>[] = useMemo(() => {
    const base: SearchableSelectOption<number>[] = VAT_RATE_OPTIONS.map((r) => ({
      value: r,
      label: `${r}%`,
      search: `${r} vat percent`.toLowerCase(),
    }));
    const r = form.vatRate;
    if (!VAT_RATE_OPTIONS.includes(r as (typeof VAT_RATE_OPTIONS)[number])) {
      return [
        {
          value: r,
          label: `${r}% (from product)`,
          search: `${r} vat`.toLowerCase(),
        },
        ...base,
      ];
    }
    return base;
  }, [form.vatRate]);

  const lowStockCount = useMemo(() => products.filter((p) => p.isLowStock).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.qtyInStock <= 0).length, [products]);

  const stats = [
    {
      label: "Total Products",
      value: formatNumber(totalCount),
      icon: Package,
      color: "from-blue-500 to-violet-500",
    },
    {
      label: "Low Stock",
      value: formatNumber(lowStockCount),
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Out of Stock",
      value: formatNumber(outOfStockCount),
      icon: Archive,
      color: "from-rose-500 to-pink-500",
    },
    {
      label: "This page",
      value: formatNumber(products.length),
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const openCreateModal = () => {
    setEditingProduct(null);
    const firstCat = categories[0]?.categoryId ?? 0;
    const firstBrand = brands[0]?.brandId ?? 0;
    setForm({
      ...emptyForm(),
      productCode: suggestNextProductCode(products, totalCount),
      categoryId: firstCat,
      brandId: firstBrand,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Product) => {
    setEditingProduct(item);
    setForm({
      productCode: item.productCode,
      productName: item.productName,
      barcode: item.barcode ?? "",
      description: item.description ?? "",
      categoryId: item.categoryId,
      subCategoryId: item.subCategoryId ?? null,
      brandId: item.brandId,
      unitOfMeasurement: item.unitOfMeasurement,
      sellingPriceExVat: item.sellingPrice,
      vatRate: item.vatRate,
      stockAlertLevel: item.stockAlertLevel,
      reorderLevel: item.reorderLevel,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm());
  };

  const handleSubmit = async () => {
    if (!form.productCode.trim() || !form.productName.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Product code and name are required",
          duration: 3000,
        })
      );
      return;
    }
    if (!form.categoryId || !form.brandId) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Category and brand are required",
          duration: 3000,
        })
      );
      return;
    }

    const barcodeValue = (barcodeInputRef.current?.value ?? form.barcode).trim();

    const payloadBase = {
      ...form,
      productCode: form.productCode.trim(),
      productName: form.productName.trim(),
      barcode: barcodeValue,
      description: form.description ?? "",
      subCategoryId: form.subCategoryId || null,
    };

    if (editingProduct) {
      const payload: UpdateProductRequest = { productId: editingProduct.productId, ...payloadBase };
      const result = await dispatch(updateProduct(payload));
      if (updateProduct.fulfilled.match(result)) {
        resetModal();
        void refreshProductList();
      }
      return;
    }

    const result = await dispatch(createProduct(payloadBase));
    if (createProduct.fulfilled.match(result)) {
      resetModal();
      void refreshProductList();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteProduct(deleteTarget.productId));
    if (deleteProduct.fulfilled.match(result)) {
      setDeleteTarget(null);
      void refreshProductList();
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "productName",
      label: "Product",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{item.productName}</p>
            <p className="text-xs text-slate-400">{item.productCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "categoryName",
      label: "Category",
      render: (item) => (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {item.categoryName ?? "—"}
        </span>
      ),
    },
    {
      key: "brandName",
      label: "Brand",
      render: (item) => <span className="text-sm text-slate-600">{item.brandName ?? "—"}</span>,
    },
    {
      key: "costPrice",
      label: "Cost",
      render: (item) => (
        <span className="text-sm text-slate-500">
          {item.costPrice != null ? formatCurrency(item.costPrice) : item.lastPurchasePrice != null ? formatCurrency(item.lastPurchasePrice) : "—"}
        </span>
      ),
    },
    {
      key: "sellingPrice",
      label: "Price",
      render: (item) => (
        <span className="text-sm font-bold text-slate-800">{formatCurrency(item.sellingPrice)}</span>
      ),
    },
    {
      key: "qtyInStock",
      label: "Stock",
      render: (item) => {
        const isLow = item.isLowStock ?? item.qtyInStock <= item.stockAlertLevel;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn("text-sm font-semibold", isLow ? "text-rose-600" : "text-slate-700")}
            >
              {item.qtyInStock}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                <AlertTriangle className="h-3 w-3" />
                Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} size="sm" />,
    },
    {
      key: "actions",
      label: "",
      className: "w-28",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewProduct(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            disabled={actionLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product inventory and stock levels"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                  stat.color
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={products}
        rowKey="productId"
        title="All Products"
        description="View and manage your complete product catalog"
        totalCount={totalCount}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageChange={(p) =>
          dispatch(
            fetchProducts({
              pageNumber: p,
              pageSize,
              searchTerm: debouncedSearch.trim() || undefined,
              sortDirection: "desc",
            })
          )
        }
        onPageSizeChange={(s) =>
          dispatch(
            fetchProducts({
              pageNumber: 1,
              pageSize: s,
              searchTerm: debouncedSearch.trim() || undefined,
              sortDirection: "desc",
            })
          )
        }
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search products, codes, barcodes…"
        onAdd={openCreateModal}
        addLabel="Add Product"
        onExport={() => {}}
        onFilter={() => {}}
        onRefresh={() => void refreshProductList()}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={resetModal}
        title={editingProduct ? "Edit Product" : "Add Product"}
        description={editingProduct ? "Update product details" : "Create a new product"}
        size="full"
        scrollableContent={false}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetModal}
              disabled={actionLoading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-4 lg:gap-y-2">
          <div className="lg:col-span-2">
            <label htmlFor="prod-code" className="mb-1 block text-sm font-medium text-gray-700">
              Product code <span className="font-normal text-gray-500">(auto-suggested, editable)</span>
            </label>
            <input
              id="prod-code"
              value={form.productCode}
              onChange={(e) => setForm({ ...form, productCode: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor="prod-name" className="mb-1 block text-sm font-medium text-gray-700">
              Product name <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-name"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="prod-barcode" className="mb-1 block text-sm font-medium text-gray-700">
              Barcode
            </label>
            <input
              ref={barcodeInputRef}
              id="prod-barcode"
              name="barcode"
              defaultValue={form.barcode}
              onInput={(e) => {
                const v = (e.currentTarget as HTMLInputElement).value;
                setForm((f) => (f.barcode === v ? f : { ...f, barcode: v }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                }
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="Scan barcode (USB scanner) or type here"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="prod-uom" className="mb-1 block text-sm font-medium text-gray-700">
              Unit of measurement
            </label>
            <SearchableSelect
              id="prod-uom"
              options={uomOptions}
              value={form.unitOfMeasurement}
              onChange={(v) => setForm({ ...form, unitOfMeasurement: v })}
              placeholder="Search unit (e.g. kg, Pack)…"
              emptyHint="No matching unit"
            />
          </div>
          <div>
            <label htmlFor="prod-category" className="mb-1 block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="prod-category"
              options={categoryOptions}
              value={form.categoryId}
              onChange={(id) => setForm({ ...form, categoryId: id, subCategoryId: null })}
              placeholder="Search category…"
              disabled={categoryOptions.length === 0}
              emptyHint="No categories loaded"
            />
          </div>
          <div>
            <label htmlFor="prod-subcat" className="mb-1 block text-sm font-medium text-gray-700">
              Subcategory
            </label>
            <SearchableSelect
              id="prod-subcat"
              options={subCategoryOptions}
              value={form.subCategoryId ?? 0}
              onChange={(id) =>
                setForm({
                  ...form,
                  subCategoryId: id === 0 ? null : id,
                })
              }
              placeholder={form.categoryId ? "Search subcategory…" : "Select a category first"}
              disabled={!form.categoryId}
              emptyHint="No subcategories for this category"
            />
          </div>
          <div>
            <label htmlFor="prod-brand" className="mb-1 block text-sm font-medium text-gray-700">
              Brand <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="prod-brand"
              options={brandOptions}
              value={form.brandId}
              onChange={(id) => setForm({ ...form, brandId: id })}
              placeholder="Search brand…"
              disabled={brandOptions.length === 0}
              emptyHint="No brands loaded"
            />
          </div>
          <div>
            <label htmlFor="prod-price-ex" className="mb-1 block text-sm font-medium text-gray-700">
              Selling price (ex VAT)
            </label>
            <input
              id="prod-price-ex"
              type="number"
              step="0.01"
              value={form.sellingPriceExVat}
              onChange={(e) => setForm({ ...form, sellingPriceExVat: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="prod-vat" className="mb-1 block text-sm font-medium text-gray-700">
              VAT rate
            </label>
            <SearchableSelect
              id="prod-vat"
              options={vatOptions}
              value={form.vatRate}
              onChange={(v) => setForm({ ...form, vatRate: v })}
              placeholder="Search VAT rate…"
              emptyHint="No rate"
            />
          </div>
          <div>
            <label htmlFor="prod-stock-alert" className="mb-1 block text-sm font-medium text-gray-700">
              Stock alert level
            </label>
            <input
              id="prod-stock-alert"
              type="number"
              step="0.01"
              value={form.stockAlertLevel}
              onChange={(e) => setForm({ ...form, stockAlertLevel: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="prod-reorder" className="mb-1 block text-sm font-medium text-gray-700">
              Reorder level
            </label>
            <input
              id="prod-reorder"
              type="number"
              step="0.01"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor="prod-desc" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center lg:col-span-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              Active
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title="Product details"
        description={viewProduct?.productCode}
        size="sm"
      >
        {viewProduct && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Name:</span> {viewProduct.productName}
            </p>
            <p>
              <span className="font-medium text-slate-800">Category:</span>{" "}
              {viewProduct.categoryName ?? "—"}
              {viewProduct.subCategoryName ? ` · ${viewProduct.subCategoryName}` : ""}
            </p>
            <p>
              <span className="font-medium text-slate-800">Brand:</span> {viewProduct.brandName ?? "—"}
            </p>
            <p>
              <span className="font-medium text-slate-800">Stock:</span> {viewProduct.qtyInStock} (
              {viewProduct.unitOfMeasurement})
            </p>
            <p>
              <span className="font-medium text-slate-800">Selling price:</span>{" "}
              {formatCurrency(viewProduct.sellingPrice)}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete product"
        description="This cannot be undone"
        size="sm"
      >
        <div className="py-2 text-center text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-800">&quot;{deleteTarget?.productName}&quot;</span>?
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            disabled={actionLoading}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {actionLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
