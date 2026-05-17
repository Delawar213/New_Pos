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
