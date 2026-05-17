// ============================================
// Product Types (API-aligned)
// ============================================

export interface Product {
  productId: number;
  productCode: string;
  barcode?: string;
  categoryId: number;
  categoryName?: string;
  brandId: number;
  brandName?: string;
  subCategoryId?: number | null;
  subCategoryName?: string;
  productName: string;
  description?: string;
  qtyInStock: number;
  stockAlertLevel: number;
  unitOfMeasurement: string;
  sellingPrice: number;
  vatRate: number;
  isVatExempt?: boolean;
  sellingPriceIncVat?: number;
  isLowStock?: boolean;
  reorderLevel: number;
  isAvailable?: boolean;
  isActive: boolean;
  createdDatetime: string;
  imagePath?: string;
  lastPurchasePrice?: number;
  costPrice?: number;
  minSellingPrice?: number;
  location?: string;
}

export interface PaginatedProductResponse {
  data: Product[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateProductRequest {
  productCode: string;
  productName: string;
  barcode: string;
  description: string;
  categoryId: number;
  subCategoryId: number | null;
  brandId: number;
  unitOfMeasurement: string;
  sellingPriceExVat: number;
  vatRate: number;
  stockAlertLevel: number;
  reorderLevel: number;
  isActive: boolean;
}

export interface UpdateProductRequest extends CreateProductRequest {
  productId: number;
}

/** Row from `GET /api/Products/outofstock` and low-stock endpoints. */
export interface ProductStockAlertRow {
  productId: number;
  productCode: string;
  productName: string;
  categoryName?: string;
  qtyInStock: number;
  stockAlertLevel: number;
  reorderLevel: number;
  alertType: string;
}

/** Row from `GET /api/Products/pos/search`. */
export interface ProductPosSearchRow {
  productId: number;
  productCode: string;
  productName: string;
  barcode?: string;
  sellingPrice: number;
  qtyInStock: number;
  vatRate: number;
}

export type ProductListMode =
  | "catalog"
  | "category"
  | "brand"
  | "outofstock"
  | "lowstock"
  | "search";

/** Batch row from `GET /api/Products/{productId}/batches-for-pricing`. */
export interface ProductPricingBatch {
  purchaseDetailId: number;
  batchNumber: string;
  purchaseDate: string;
  costPrice: number;
  sellingPriceExVat: number;
  sellingPriceIncVat: number;
  remainingQuantity: number;
  vatRate: number;
  purchaseCode?: string;
  supplierName?: string;
}

/** `GET /api/Products/{productId}/batches-for-pricing` response `data`. */
export interface ProductBatchesForPricing {
  productId: number;
  productCode: string;
  productName: string;
  sellingPrice: number;
  minSellingPrice: number;
  vatRate: number;
  qtyInStock: number;
  batches: ProductPricingBatch[];
}

export interface ProductBatchPriceUpdate {
  purchaseDetailId: number;
  sellingPriceExVat: number;
  sellingPriceIncVat: number;
}

/** Body for `PUT /api/Products/{productId}/selling-price`. */
export interface UpdateProductSellingPriceRequest {
  productId: number;
  updateAllBatches: boolean;
  newSellingPriceExVat: number;
  batchUpdates: ProductBatchPriceUpdate[];
  updateProductDefault: boolean;
  reason: string;
  updatedBy: number;
}
