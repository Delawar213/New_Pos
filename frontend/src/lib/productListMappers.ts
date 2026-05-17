import type { Product, ProductPosSearchRow, ProductStockAlertRow } from "@/types/product";

/** Maps partial stock-alert API rows into list `Product` shape for the table. */
export function mapStockAlertRowToProduct(row: ProductStockAlertRow): Product {
  const isLow = row.alertType?.toLowerCase().includes("low");
  return {
    productId: row.productId,
    productCode: row.productCode,
    productName: row.productName,
    categoryId: 0,
    categoryName: row.categoryName,
    brandId: 0,
    qtyInStock: Number(row.qtyInStock) || 0,
    stockAlertLevel: Number(row.stockAlertLevel) || 0,
    reorderLevel: Number(row.reorderLevel) || 0,
    unitOfMeasurement: "—",
    sellingPrice: 0,
    vatRate: 0,
    isLowStock: isLow,
    isActive: true,
    createdDatetime: "",
  };
}

/** Maps POS search API rows into list `Product` shape. */
export function mapPosSearchRowToProduct(row: ProductPosSearchRow): Product {
  return {
    productId: row.productId,
    productCode: row.productCode,
    productName: row.productName,
    barcode: row.barcode,
    categoryId: 0,
    brandId: 0,
    qtyInStock: Number(row.qtyInStock) || 0,
    stockAlertLevel: 0,
    reorderLevel: 0,
    unitOfMeasurement: "—",
    sellingPrice: Number(row.sellingPrice) || 0,
    vatRate: Number(row.vatRate) || 0,
    isActive: true,
    createdDatetime: "",
  };
}

/** Ensures numeric fields on full product list rows from category/brand APIs. */
export function normalizeProductRow(row: Product): Product {
  return {
    ...row,
    qtyInStock: Number(row.qtyInStock) || 0,
    stockAlertLevel: Number(row.stockAlertLevel) || 0,
    reorderLevel: Number(row.reorderLevel) || 0,
    sellingPrice: Number(row.sellingPrice) || 0,
    vatRate: Number(row.vatRate) || 0,
    costPrice: row.costPrice != null ? Number(row.costPrice) : undefined,
    lastPurchasePrice:
      row.lastPurchasePrice != null ? Number(row.lastPurchasePrice) : undefined,
  };
}
