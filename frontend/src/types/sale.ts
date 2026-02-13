// ============================================
// Sale Types
// ============================================

export type SaleStatus = "completed" | "pending" | "cancelled" | "returned";

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
  paymentMethod: string;
  note?: string;
  items: SaleItem[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SaleItem {
  id: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  saleDate: string;
  status: SaleStatus;
  discountAmount: number;
  paymentMethod: string;
  paidAmount: number;
  note?: string;
  items: Omit<SaleItem, "id" | "productName" | "sku" | "taxAmount" | "total">[];
}

export interface UpdateSaleRequest extends CreateSaleRequest {
  id: number;
}
