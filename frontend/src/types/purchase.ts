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
  discountPercentage: number;
  description?: string;
  notes?: string;
  createdBy?: string;
  createdDatetime: string;
  purchaseDetails: PurchaseDetail[];
}

export interface PurchaseDetail {
  detailId?: number;
  productId: number;
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
