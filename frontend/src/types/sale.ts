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
  /** Overall percentage discount from API (mutually exclusive with flat discountAmount in PUT). */
  discountPercentage?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  /** From API `paymentStatus` (e.g. Paid, Partial). */
  paymentMethod: string;
  /** API `description` (header). */
  description?: string;
  /** API `notes` (separate from description). */
  notes?: string | null;
  /** Legacy / merged note for receipts (often description). */
  note?: string;
  items: SaleItem[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

/** Line from API `saleDetails` or legacy `items`. */
export interface SaleItem {
  /** Maps API `saleDetailId`. */
  id: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  /** Already returned on this line (API: `returnQuantity`). */
  returnQuantity?: number;
  /** API: `isReturned` — fully returned line. */
  isReturned?: boolean;
  /** Unit selling price ex VAT (API: `sellingPriceExVat`). */
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discount: number;
  /** Line total inc VAT (API: `lineTotalIncVat`). */
  total: number;
  purchaseDetailId?: number;
  /** Line flat discount (API); mutually exclusive with itemDiscountPercentage in PUT. */
  itemDiscountAmount?: number | null;
  /** Line % discount (API); mutually exclusive with itemDiscountAmount in PUT. */
  itemDiscountPercentage?: number | null;
}

/** POST `/api/sales/return` */
export interface SaleReturnDetailLine {
  saleDetailId: number;
  returnQuantity: number;
}

export interface SaleReturnRequest {
  saleId: number;
  returnDate: string;
  returnReason: string;
  refundType: "Cash" | "Credit";
  bankAccountId: number | null;
  returnDetails: SaleReturnDetailLine[];
}

export interface SaleReturnReturnedItem {
  saleDetailId: number;
  productName?: string;
  returnQuantity: number;
  returnAmount: number;
}

export interface SaleReturnResultData {
  saleId: number;
  invoiceNumber: string;
  totalReturnAmount: number;
  newRemainingAmount: number;
  newPaymentStatus: string;
  refundType: string;
  saleStatus: string;
  transactionCode?: string;
  returnedItems: SaleReturnReturnedItem[];
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

/** One line in PUT `/api/sales/{id}` body. */
export interface SaleUpdateDetailPayload {
  saleDetailId: number;
  productId: number;
  purchaseDetailId: number;
  quantity: number;
  sellingPriceExVat: number;
  itemDiscountAmount: number | null;
  itemDiscountPercentage: number | null;
}

/**
 * Arguments for `updateSale` thunk (URL id + JSON body fields except `updatedBy` / `roleId`, injected in thunk).
 */
export interface SaleUpdateThunkArg {
  id: number;
  customerId: number;
  saleDate: string;
  discountAmount: number | null;
  discountPercentage: number | null;
  description: string;
  notes: string | null;
  status: string;
  saleDetails: SaleUpdateDetailPayload[];
}

/** Typical summary in `data` after PUT sale. */
export interface SaleUpdateResultSummary {
  saleId: number;
  invoiceNumber: string;
  totalAmountIncVat: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  status: string;
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
