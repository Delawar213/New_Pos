// ============================================
// Product Types
// ============================================

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId: number;
  categoryName?: string;
  brandId: number;
  brandName?: string;
  supplierId?: number;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  alertQuantity: number;
  taxPercentage: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  image?: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId: number;
  brandId: number;
  supplierId?: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  alertQuantity: number;
  taxPercentage: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  image?: string;
  unit: string;
  isActive: boolean;
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: number;
}
