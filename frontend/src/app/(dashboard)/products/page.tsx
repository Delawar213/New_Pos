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
  Tag,
  Barcode,
  Printer,
  Sparkles,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Modal,
  DecimalInput,
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Product, CreateProductRequest, UpdateProductRequest } from "@/types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";
import { printProductStockReport, type StockPrintKind } from "@/lib/productStockPrint";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProducts,
  fetchAllProducts,
  fetchProductsByCategory,
  fetchProductsByBrand,
  fetchProductsOutOfStock,
  fetchProductsLowStock,
  resolveProductQuickSearch,
  createProduct,
  updateProduct,
  deleteProduct,
  clearProductState,
} from "@/store/slices/product/product.slice";
import {
  ProductFiltersBar,
  type StockFilterValue,
} from "@/components/products/ProductFiltersBar";
import { ProductPriceUpdateModal } from "@/components/products/ProductPriceUpdateModal";
import { ProductBarcodeLabelModal } from "@/components/products/ProductBarcodeLabelModal";
import {
  ProductFormSection,
  productFieldClass,
  productLabelClass,
} from "@/components/products/productFormStyles";
import {
  suggestNextInternalBarcode,
  barcodeUsedByOther,
  isInternalBarcode,
} from "@/lib/internalBarcode";
import { fetchCategories } from "@/store/slices/category/category.slice";
import { fetchBrands } from "@/store/slices/brand/brand.slice";
import { fetchSubCategories } from "@/store/slices/subCategory/subCategory.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import { downloadCsv, timestampForFilename } from "@/lib/exportCsv";

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
  vatRate: 0,
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
/** Wait until the user pauses typing before POS quick search runs. */
const PRODUCT_SEARCH_DEBOUNCE_MS = 750;

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
    listMode,
    listFilterLabel,
    allProducts,
  } = useAppSelector((s) => s.product);
  const { categories } = useAppSelector((s) => s.category);
  const { brands } = useAppSelector((s) => s.brand);
  const { subCategories } = useAppSelector((s) => s.subCategory);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [priceUpdateProduct, setPriceUpdateProduct] = useState<Product | null>(null);
  const [labelPrintProducts, setLabelPrintProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductRequest>(emptyForm());
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilterId, setCategoryFilterId] = useState<number | "">("");
  const [brandFilterId, setBrandFilterId] = useState<number | "">("");
  const [stockFilter, setStockFilter] = useState<StockFilterValue>("all");
  const debouncedSearch = useDebouncedValue(searchInput, PRODUCT_SEARCH_DEBOUNCE_MS);
  const searchPrevRef = useRef<string | null>(null);
  const lastFetchedSearchRef = useRef<string>("");
  const isCatalogMode = listMode === "catalog";
  const trimmedSearch = searchInput.trim();
  const debouncedSearchTrimmed = debouncedSearch.trim();
  const searchPending =
    trimmedSearch.length >= 2 && trimmedSearch !== debouncedSearchTrimmed;
  const canPrintStock =
    stockFilter === "outofstock" ||
    stockFilter === "lowstock" ||
    listMode === "outofstock" ||
    listMode === "lowstock";

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
    void dispatch(fetchAllProducts());
  }, [dispatch]);

  const barcodeCatalog = useMemo(() => {
    const map = new Map<number, Product>();
    for (const p of allProducts) map.set(p.productId, p);
    for (const p of products) map.set(p.productId, p);
    return Array.from(map.values());
  }, [allProducts, products]);

  const productsWithBarcodeOnPage = useMemo(
    () => products.filter((p) => (p.barcode ?? "").trim().length > 0),
    [products]
  );

  const handleGenerateInternalBarcode = () => {
    const next = suggestNextInternalBarcode(barcodeCatalog);
    if (
      barcodeUsedByOther(next, barcodeCatalog, editingProduct?.productId)
    ) {
      dispatch(
        addToast({
          type: "warning",
          title: "Barcode in use",
          message: `${next} is already assigned to another product.`,
        })
      );
      return;
    }
    commitBarcodeValue(next);
    dispatch(
      addToast({
        type: "success",
        title: "Internal barcode",
        message: `Assigned ${next} — save the product, then print a shelf label.`,
        duration: 4000,
      })
    );
  };

  const loadCatalogPage = useCallback(
    (page = currentPage, size = pageSize) => {
      void dispatch(fetchProducts(buildPagedFetchArgs(page, size, "", searchPrevRef)));
    },
    [dispatch, currentPage, pageSize]
  );

  const applyListFilters = useCallback(() => {
    if (stockFilter === "outofstock") {
      void dispatch(fetchProductsOutOfStock());
      return;
    }
    if (stockFilter === "lowstock") {
      void dispatch(fetchProductsLowStock());
      return;
    }
    if (categoryFilterId !== "") {
      const cat = categories.find((c) => c.categoryId === categoryFilterId);
      void dispatch(
        fetchProductsByCategory({
          categoryId: categoryFilterId,
          categoryName: cat?.categoryName ?? `Category #${categoryFilterId}`,
        })
      );
      return;
    }
    if (brandFilterId !== "") {
      const brand = brands.find((b) => b.brandId === brandFilterId);
      void dispatch(
        fetchProductsByBrand({
          brandId: brandFilterId,
          brandName: brand?.brandName ?? `Brand #${brandFilterId}`,
        })
      );
      return;
    }
    loadCatalogPage();
  }, [
    dispatch,
    stockFilter,
    categoryFilterId,
    brandFilterId,
    categories,
    brands,
    loadCatalogPage,
  ]);

  /** POS quick search — only after user stops typing (debounced). */
  useEffect(() => {
    const term = debouncedSearchTrimmed;
    if (term.length >= 2) {
      if (lastFetchedSearchRef.current === term) return;
      lastFetchedSearchRef.current = term;
      void dispatch(resolveProductQuickSearch(term));
      return;
    }
    lastFetchedSearchRef.current = "";
  }, [dispatch, debouncedSearchTrimmed]);

  /** Category, brand, stock filters, and catalog — not on every keystroke. */
  useEffect(() => {
    if (debouncedSearchTrimmed.length >= 2) return;
    if (debouncedSearchTrimmed.length === 1) return;
    applyListFilters();
  }, [
    debouncedSearchTrimmed,
    applyListFilters,
    currentPage,
    pageSize,
  ]);

  const handlePrintStockList = () => {
    const kind: StockPrintKind =
      stockFilter === "lowstock" || listMode === "lowstock" ? "lowstock" : "outofstock";
    if (products.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Nothing to print",
          message: "Load products first, then print.",
          duration: 3000,
        })
      );
      return;
    }
    printProductStockReport(kind, products);
  };

  const refreshProductList = () => {
    const term = debouncedSearch.trim();
    if (term.length >= 2) return void dispatch(resolveProductQuickSearch(term));
    if (stockFilter === "outofstock") return void dispatch(fetchProductsOutOfStock());
    if (stockFilter === "lowstock") return void dispatch(fetchProductsLowStock());
    if (categoryFilterId !== "") {
      const cat = categories.find((c) => c.categoryId === categoryFilterId);
      return void dispatch(
        fetchProductsByCategory({
          categoryId: categoryFilterId,
          categoryName: cat?.categoryName ?? `Category #${categoryFilterId}`,
        })
      );
    }
    if (brandFilterId !== "") {
      const brand = brands.find((b) => b.brandId === brandFilterId);
      return void dispatch(
        fetchProductsByBrand({
          brandId: brandFilterId,
          brandName: brand?.brandName ?? `Brand #${brandFilterId}`,
        })
      );
    }
    return loadCatalogPage();
  };

  const handleExportProducts = useCallback(async () => {
    let rows = products;
    if (isCatalogMode && totalCount > rows.length) {
      try {
        const page = await dispatch(
          fetchProducts({
            pageNumber: 1,
            pageSize: Math.min(Math.max(totalCount, 1), 5000),
            sortDirection: "desc",
          })
        ).unwrap();
        rows = page.data?.data ?? rows;
      } catch {
        dispatch(
          addToast({
            type: "warning",
            title: "Partial export",
            message: "Could not load all pages — exporting the current list only.",
          })
        );
      } finally {
        refreshProductList();
      }
    }
    if (rows.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Nothing to export",
          message: "No products match the current filters.",
        })
      );
      return;
    }
    const label = (listFilterLabel || "products").replace(/[^\w-]+/g, "_").slice(0, 40);
    downloadCsv(
      `${label || "products"}-${timestampForFilename()}.csv`,
      [
        "Code",
        "Name",
        "Barcode",
        "Category",
        "Brand",
        "Unit",
        "Cost",
        "Price",
        "VAT %",
        "Stock",
        "Alert level",
        "Active",
      ],
      rows.map((p) => [
        p.productCode,
        p.productName,
        p.barcode ?? "",
        p.categoryName ?? "",
        p.brandName ?? "",
        p.unitOfMeasurement,
        p.costPrice ?? p.lastPurchasePrice ?? "",
        p.sellingPrice,
        p.vatRate,
        p.qtyInStock,
        p.stockAlertLevel,
        p.isActive ? "Yes" : "No",
      ])
    );
    dispatch(
      addToast({
        type: "success",
        title: "Export ready",
        message: `Downloaded ${rows.length} product(s) as CSV.`,
        duration: 3000,
      })
    );
  }, [products, isCatalogMode, totalCount, dispatch, listFilterLabel, refreshProductList]);

  const handleCategoryFilterChange = (id: number | "") => {
    setCategoryFilterId(id);
    setBrandFilterId("");
    setStockFilter("all");
    setSearchInput("");
    if (id === "") {
      void dispatch(fetchProducts(buildPagedFetchArgs(1, pageSize, "", searchPrevRef)));
      return;
    }
    const cat = categories.find((c) => c.categoryId === id);
    void dispatch(
      fetchProductsByCategory({
        categoryId: id,
        categoryName: cat?.categoryName ?? `Category #${id}`,
      })
    );
  };

  const handleBrandFilterChange = (id: number | "") => {
    setBrandFilterId(id);
    setCategoryFilterId("");
    setStockFilter("all");
    setSearchInput("");
    if (id === "") {
      void dispatch(fetchProducts(buildPagedFetchArgs(1, pageSize, "", searchPrevRef)));
      return;
    }
    const brand = brands.find((b) => b.brandId === id);
    void dispatch(
      fetchProductsByBrand({
        brandId: id,
        brandName: brand?.brandName ?? `Brand #${id}`,
      })
    );
  };

  const handleStockFilterChange = (value: StockFilterValue) => {
    setStockFilter(value);
    setCategoryFilterId("");
    setBrandFilterId("");
    setSearchInput("");
    if (value === "outofstock") {
      void dispatch(fetchProductsOutOfStock());
      return;
    }
    if (value === "lowstock") {
      void dispatch(fetchProductsLowStock());
      return;
    }
    void dispatch(fetchProducts(buildPagedFetchArgs(1, pageSize, "", searchPrevRef)));
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setCategoryFilterId("");
    setBrandFilterId("");
    setStockFilter("all");
    void dispatch(fetchProducts(buildPagedFetchArgs(1, pageSize, "", searchPrevRef)));
  };

  const handleShowFilters = () => {
    document.getElementById("product-filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    requestAnimationFrame(() => commitBarcodeValue(""));
  };

  const openEditModal = (item: Product) => {
    setEditingProduct(item);
    const bc = item.barcode ?? "";
    setForm({
      productCode: item.productCode,
      productName: item.productName,
      barcode: bc,
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
    requestAnimationFrame(() => commitBarcodeValue(bc));
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
        const isOut = item.qtyInStock <= 0;
        const isLow = item.isLowStock ?? (!isOut && item.qtyInStock <= item.stockAlertLevel);
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                isOut ? "text-rose-700" : isLow ? "text-amber-700" : "text-slate-700"
              )}
            >
              {item.qtyInStock}
            </span>
            {isOut ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                <Archive className="h-3 w-3" />
                Out
              </span>
            ) : isLow ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Low
              </span>
            ) : null}
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
      className: "w-44",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {(item.barcode ?? "").trim() ? (
            <button
              type="button"
              onClick={() => setLabelPrintProducts([item])}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-600"
              title="Print shelf label"
            >
              <Printer className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openEditModal(item)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              title="Edit product to add barcode"
            >
              <Barcode className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPriceUpdateProduct(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            title="Update price"
          >
            <Tag className="h-4 w-4" />
          </button>
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

      <ProductFiltersBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        categoryId={categoryFilterId}
        brandId={brandFilterId}
        stockFilter={stockFilter}
        categoryOptions={categories.map((c) => ({
          value: c.categoryId,
          label: c.categoryName,
        }))}
        brandOptions={brands.map((b) => ({ value: b.brandId, label: b.brandName }))}
        onCategoryChange={handleCategoryFilterChange}
        onBrandChange={handleBrandFilterChange}
        onStockFilterChange={handleStockFilterChange}
        onClearFilters={handleClearFilters}
        listMode={listMode}
        listFilterLabel={listFilterLabel}
        resultCount={products.length}
        loading={loading}
        searchPending={searchPending}
        canPrintStock={canPrintStock}
        onPrintStock={handlePrintStockList}
        printDisabled={loading}
      />

      {productsWithBarcodeOnPage.length > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setLabelPrintProducts(productsWithBarcodeOnPage)}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100"
          >
            <Printer className="h-4 w-4" />
            Print shelf labels ({productsWithBarcodeOnPage.length} on this page)
          </button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={products}
        rowKey="productId"
        title={listFilterLabel || "All products"}
        description={
          isCatalogMode
            ? "Paginated catalog — use filters above for category, brand, stock, or quick search"
            : `${products.length} result${products.length === 1 ? "" : "s"} from the active filter`
        }
        totalCount={totalCount}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageChange={
          isCatalogMode
            ? (p) => void dispatch(fetchProducts(buildPagedFetchArgs(p, pageSize, "", searchPrevRef)))
            : undefined
        }
        onPageSizeChange={
          isCatalogMode
            ? (s) => void dispatch(fetchProducts(buildPagedFetchArgs(1, s, "", searchPrevRef)))
            : undefined
        }
        sortNewestFirst={isCatalogMode}
        onAdd={openCreateModal}
        addLabel="Add Product"
        onFilter={handleShowFilters}
        onExport={() => void handleExportProducts()}
        onPrint={canPrintStock ? handlePrintStockList : undefined}
        printLabel="Print list"
        onRefresh={() => void refreshProductList()}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={resetModal}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="xl"
        scrollableContent
        className="sm:max-w-[40rem] lg:max-w-5xl"
        footer={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={!form.barcode.trim() && !(barcodeInputRef.current?.value ?? "").trim()}
              onClick={() => {
                const bc = (barcodeInputRef.current?.value ?? form.barcode).trim();
                if (!bc) return;
                const inc = form.sellingPriceExVat * (1 + (form.vatRate || 0) / 100);
                setLabelPrintProducts([
                  {
                    ...(editingProduct ?? {}),
                    productId: editingProduct?.productId ?? 0,
                    productCode: form.productCode,
                    productName: form.productName,
                    barcode: bc,
                    categoryId: form.categoryId,
                    brandId: form.brandId,
                    unitOfMeasurement: form.unitOfMeasurement,
                    sellingPrice: form.sellingPriceExVat,
                    sellingPriceIncVat: inc,
                    vatRate: form.vatRate,
                    qtyInStock: editingProduct?.qtyInStock ?? 0,
                    stockAlertLevel: form.stockAlertLevel,
                    reorderLevel: form.reorderLevel,
                    isActive: form.isActive,
                    createdDatetime: editingProduct?.createdDatetime ?? "",
                  } as Product,
                ]);
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:w-auto sm:min-w-[140px]"
            >
              <Printer className="h-4 w-4" />
              Print label
            </button>
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetModal}
                disabled={actionLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={actionLoading}
                className="h-11 w-full rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:min-w-[140px]"
              >
                {actionLoading ? "Saving…" : editingProduct ? "Update" : "Save product"}
              </button>
            </div>
          </div>
        }
      >
        <form
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <ProductFormSection title="Basics" className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="prod-name" className={productLabelClass}>
                  Product name <span className="text-red-500">*</span>
                </label>
                <input
                  id="prod-name"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className={productFieldClass}
                  placeholder="e.g. Tomato, Chicken breast"
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="prod-code" className={productLabelClass}>
                    Product code
                  </label>
                  <input
                    id="prod-code"
                    value={form.productCode}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                    className={productFieldClass}
                    placeholder="Auto-suggested"
                  />
                </div>
                <div>
                  <label htmlFor="prod-uom" className={productLabelClass}>
                    Unit
                  </label>
                  <SearchableSelect
                    id="prod-uom"
                    options={uomOptions}
                    value={form.unitOfMeasurement}
                    onChange={(v) => setForm({ ...form, unitOfMeasurement: v })}
                    placeholder="kg, Each, Pack…"
                    emptyHint="No matching unit"
                  />
                </div>
              </div>
            </div>
          </ProductFormSection>

          <ProductFormSection title="Barcode">
            <div>
              <label htmlFor="prod-barcode" className={productLabelClass}>
                Barcode
                {isInternalBarcode(form.barcode) ? (
                  <span className="ml-2 normal-case tracking-normal text-emerald-600">
                    · internal
                  </span>
                ) : null}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
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
                  placeholder="Scan or type barcode"
                  className={cn(productFieldClass, "min-w-0 flex-1 font-mono")}
                />
                <button
                  type="button"
                  onClick={handleGenerateInternalBarcode}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 sm:min-w-[9.5rem]"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </button>
              </div>
            </div>
          </ProductFormSection>

          <ProductFormSection title="Classification">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-category" className={productLabelClass}>
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
                <label htmlFor="prod-subcat" className={productLabelClass}>
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
                  placeholder={form.categoryId ? "Search subcategory…" : "Pick category first"}
                  disabled={!form.categoryId}
                  emptyHint="No subcategories"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="prod-brand" className={productLabelClass}>
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
            </div>
          </ProductFormSection>

          <ProductFormSection title="Pricing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-price-ex" className={productLabelClass}>
                  Selling price (ex VAT)
                </label>
                <DecimalInput
                  id="prod-price-ex"
                  value={form.sellingPriceExVat}
                  onChange={(sellingPriceExVat) => setForm({ ...form, sellingPriceExVat })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="prod-vat" className={productLabelClass}>
                  VAT rate
                </label>
                <SearchableSelect
                  id="prod-vat"
                  options={vatOptions}
                  value={form.vatRate}
                  onChange={(v) => setForm({ ...form, vatRate: v })}
                  placeholder="0%, 5%, 20%…"
                  emptyHint="No rate"
                />
              </div>
            </div>
            {form.sellingPriceExVat > 0 ? (
              <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900">
                Price inc VAT:{" "}
                {formatCurrency(form.sellingPriceExVat * (1 + (form.vatRate || 0) / 100))}
                {form.unitOfMeasurement &&
                !["each", "piece"].includes(form.unitOfMeasurement.toLowerCase())
                  ? ` per ${form.unitOfMeasurement}`
                  : ""}
              </p>
            ) : null}
          </ProductFormSection>

          <ProductFormSection title="Stock alerts">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-stock-alert" className={productLabelClass}>
                  Low stock alert
                </label>
                <DecimalInput
                  id="prod-stock-alert"
                  value={form.stockAlertLevel}
                  onChange={(stockAlertLevel) => setForm({ ...form, stockAlertLevel })}
                  placeholder="10"
                />
              </div>
              <div>
                <label htmlFor="prod-reorder" className={productLabelClass}>
                  Reorder level
                </label>
                <DecimalInput
                  id="prod-reorder"
                  value={form.reorderLevel}
                  onChange={(reorderLevel) => setForm({ ...form, reorderLevel })}
                  placeholder="20"
                />
              </div>
            </div>
          </ProductFormSection>

          <ProductFormSection title="Other" className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="prod-desc" className={productLabelClass}>
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className={cn(productFieldClass, "resize-y min-h-[4.5rem]")}
                  placeholder="Optional notes"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-800">Active</span>
              </label>
            </div>
          </ProductFormSection>
        </form>
      </Modal>

      <Modal
        open={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title="Product details"
        description={viewProduct?.productCode}
        size="sm"
        footer={
          viewProduct && (viewProduct.barcode ?? "").trim() ? (
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={() => setLabelPrintProducts([viewProduct])}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Print shelf label
              </button>
            </div>
          ) : undefined
        }
      >
        {viewProduct && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Name:</span> {viewProduct.productName}
            </p>
            <p>
              <span className="font-medium text-slate-800">Barcode:</span>{" "}
              {viewProduct.barcode?.trim() ? (
                <span className="font-mono">
                  {viewProduct.barcode}
                  {isInternalBarcode(viewProduct.barcode) ? (
                    <span className="ml-1 text-emerald-600">(internal)</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-amber-700">None — edit product and use Generate</span>
              )}
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

      <ProductPriceUpdateModal
        product={priceUpdateProduct}
        open={!!priceUpdateProduct}
        onClose={() => setPriceUpdateProduct(null)}
        onSaved={() => void refreshProductList()}
      />

      <ProductBarcodeLabelModal
        open={labelPrintProducts.length > 0}
        onClose={() => setLabelPrintProducts([])}
        products={labelPrintProducts}
      />
    </div>
  );
}
