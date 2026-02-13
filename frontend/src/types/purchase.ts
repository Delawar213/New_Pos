// ============================================
// Purchase Types
// ============================================

export type PurchaseStatus = "pending" | "received" | "partial" | "cancelled";

export interface Purchase {
  id: number;
  referenceNo: string;
  supplierId: number;
  supplierName?: string;
  purchaseDate: string;
  status: PurchaseStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  note?: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  id: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  taxPercentage: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  purchaseDate: string;
  status: PurchaseStatus;
  shippingCost: number;
  discountAmount: number;
  paymentMethod: string;
  paidAmount: number;
  note?: string;
  items: Omit<PurchaseItem, "id" | "productName" | "sku" | "taxAmount" | "total">[];
}

export interface UpdatePurchaseRequest extends CreatePurchaseRequest {
  id: number;
}
