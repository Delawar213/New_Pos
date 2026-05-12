// ============================================
// Purchase Types
// ============================================

export interface Purchase {
  purchaseId: number;
  purchaseCode: string;
  supplierId: number;
  supplierName?: string;
  purchaseDate: string;
  invoiceNumber?: string;
  discountPercentage?: number;
  description?: string;
  notes?: string;
  createdBy?: string;
  createdDatetime?: string;
  /** Present on single-purchase responses; omitted on paginated list. */
  purchaseDetails?: PurchaseDetail[];
  totalItems?: number;
  subtotalExVat?: number;
  discountAmount?: number;
  netAmountExVat?: number;
  vatAmount20?: number;
  vatAmount5?: number;
  vatAmount0?: number;
  totalVatAmount?: number;
  totalAmountIncVat?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: string;
  returnAmount?: number;
  status?: string;
}

export interface PurchaseDetail {
  detailId?: number;
  purchaseDetailId?: number;
  productId: number;
  productName?: string;
  barcode?: string;
  batchNumber?: string;
  expiryDate?: string | null;
  purchasePriceExVat: number;
  discountPerUnit: number;
  vatRate: number;
  sellingPriceExVat: number;
  purchaseQuantity: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  purchaseDate: string;
  invoiceNumber: string;
  discountPercentage: number;
  description?: string;
  notes?: string;
  createdBy?: string;
  purchaseDetails: PurchaseDetail[];
}

export interface UpdatePurchaseRequest extends CreatePurchaseRequest {
  purchaseId: number;
}

export interface PaginatedPurchaseResponse {
  data: Purchase[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** POST body for recording a supplier payment against a purchase (backend may expect PascalCase). */
export interface SupplierPurchasePaymentRequest {
  purchaseId: number;
  /** Amount to pay now (typically ≤ remaining balance). */
  amount: number;
}
