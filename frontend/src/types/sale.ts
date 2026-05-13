// ============================================
// Sale Types
// ============================================

export type SaleStatus = "completed" | "pending" | "cancelled" | "returned";

/**
 * Normalized sale for UI / Redux. Populated from `GET /api/Sales` (list + detail) via mapper:
 * `saleId`→`id`, `invoiceNumber`→`invoiceNo`, `totalAmountIncVat`→`grandTotal`, etc.
 */
export interface Sale {
  id: number;
  invoiceNo: string;
  customerId?: number;
  customerName?: string;
  saleDate: string;
  status: SaleStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  /** From API `paymentStatus` (e.g. Paid, Partial). */
  paymentMethod: string;
  note?: string;
  items: SaleItem[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

/** Line from API `saleDetails` or legacy `items`. */
export interface SaleItem {
  id: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  /** Unit selling price ex VAT (API: `sellingPriceExVat`). */
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discount: number;
  /** Line total inc VAT (API: `lineTotalIncVat`). */
  total: number;
  purchaseDetailId?: number;
}

/** Line payload for POST `/api/Sales` (and related). */
export interface CreateSaleLineRequest {
  productId: number;
  purchaseDetailId?: number;
  quantity: number;
  /** Unit price excluding VAT (matches scan `sellingPriceExVat`). */
  unitPrice: number;
  taxPercentage: number;
  /** Line discount amount (currency). */
  discount: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  saleDate: string;
  status: SaleStatus;
  discountAmount: number;
  paymentMethod: string;
  paidAmount: number;
  note?: string;
  items: CreateSaleLineRequest[];
}

/** Line payload for POST `/api/Sales/pos`. */
export interface CreatePosSaleLineRequest {
  productId: number;
  purchaseDetailId: number;
  quantity: number;
  sellingPriceExVat: number;
  itemDiscountAmount: number;
  itemDiscountPercentage: number;
}

/** Payload for POST `/api/Sales/pos`. */
export interface CreatePosSaleRequest {
  customerId: number;
  discountAmount: number;
  discountPercentage: number;
  description: string;
  createdBy: number;
  items: CreatePosSaleLineRequest[];
  payment: {
    bankAccountId: number;
    paidAmount: number;
  };
}

// ---- Barcode scan (GET /api/Sales/scan/{barcode}) ----

export interface SaleScanBatch {
  purchaseDetailId: number;
  batchNumber: string;
  expiryDate: string | null;
  sellingPrice: number;
  sellingPriceExVat: number;
  remainingQuantity: number;
  purchaseDate: string | null;
}

export interface SaleBarcodeScanData {
  productId: number;
  productCode: string;
  productName: string;
  barcode: string;
  unitOfMeasurement: string;
  qtyInStock: number;
  vatRate: number;
  isVatExempt: boolean;
  purchaseDetailId: number;
  batchNumber: string;
  expiryDate: string | null;
  sellingPrice: number;
  sellingPriceExVat: number;
  remainingQuantity: number;
  totalBatches: number;
  hasMultipleBatches: boolean;
  availableBatches: SaleScanBatch[];
}

export interface UpdateSaleRequest extends CreateSaleRequest {
  id: number;
}

// ---- POS: GET /api/pos/scan/{barcode} (same payload shape as legacy Sales scan) ----
export type PosBarcodeScanData = SaleBarcodeScanData;

/** POST /api/pos/price-override/validate */
export interface PosPriceOverrideValidateRequest {
  productId: number;
  purchaseDetailId: number;
  /** Unit selling price including VAT */
  proposedSellingPrice: number;
  proposedSellingPriceExVat?: number;
  barcode?: string;
}

export interface PosPriceOverrideValidateData {
  allowed: boolean;
  message?: string;
}
