import type { CartItem } from "@/store/slices/cart/cart.slice";
import type { SaleBarcodeScanData, SaleScanBatch } from "@/types/sale";

function newCartLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `L-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function syntheticFromRoot(root: SaleBarcodeScanData): SaleScanBatch {
  return {
    purchaseDetailId: root.purchaseDetailId,
    batchNumber: root.batchNumber,
    expiryDate: root.expiryDate,
    sellingPrice: root.sellingPrice,
    sellingPriceExVat: root.sellingPriceExVat,
    remainingQuantity: root.remainingQuantity,
    purchaseDate: null,
  };
}

function fifoBatchSort(a: SaleScanBatch, b: SaleScanBatch): number {
  const ad = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
  const bd = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
  if (ad !== bd) return ad - bd;
  const ae = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
  const be = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
  return ae - be;
}

/** In-stock batches only, FIFO (purchase date, then expiry). Empty if nothing has stock. */
export function listInStockBatchesSorted(root: SaleBarcodeScanData): SaleScanBatch[] {
  const fromList = (root.availableBatches ?? []).filter((b) => (b.remainingQuantity ?? 0) > 0);
  if (fromList.length === 0) {
    const syn = syntheticFromRoot(root);
    return (syn.remainingQuantity ?? 0) > 0 ? [syn] : [];
  }
  return [...fromList].sort(fifoBatchSort);
}

/**
 * FIFO: earliest purchase date, then earliest expiry. Falls back to root row if no batch list.
 * When nothing has stock, returns a synthetic row (may have remainingQuantity 0).
 */
export function pickFifoBatch(root: SaleBarcodeScanData): SaleScanBatch {
  const list = listInStockBatchesSorted(root);
  if (list.length === 0) {
    return syntheticFromRoot(root);
  }
  return list[0]!;
}

/**
 * Next batch to use for this scan given the cart: FIFO order, skip batches whose line is already full.
 * Same barcode re-scan moves to the next batch when the current batch line has no remaining capacity.
 */
export function selectBatchForNextScan(
  root: SaleBarcodeScanData,
  cartItems: CartItem[]
): SaleScanBatch | null {
  const normBc = (b: string | undefined) => String(b ?? "").trim();
  const targetBc = normBc(root.barcode);
  const sorted = listInStockBatchesSorted(root);
  if (sorted.length === 0) return null;

  for (const batch of sorted) {
    const freshRem = Math.max(0, batch.remainingQuantity ?? 0);
    const line = cartItems.find(
      (c) =>
        c.productId === root.productId &&
        normBc(c.barcode) === targetBc &&
        c.purchaseDetailId === batch.purchaseDetailId
    );
    if (!line) {
      return batch;
    }
    if (line.quantity < freshRem) {
      return batch;
    }
  }
  return null;
}

export function incVatToExVat(incVat: number, vatRate: number, isVatExempt: boolean): number {
  if (isVatExempt || vatRate <= 0) return round2(incVat);
  return round2(incVat / (1 + vatRate / 100));
}

export function exVatToIncVat(exVat: number, vatRate: number, isVatExempt = false): number {
  if (isVatExempt || vatRate <= 0) return round2(exVat);
  return round2(exVat * (1 + vatRate / 100));
}

/**
 * Build cart line: FIFO batch (or `chosenBatch` from `selectBatchForNextScan`); keeps `availableBatches` for Change batch UI.
 */
export function buildCartItemFromScan(
  root: SaleBarcodeScanData,
  chosenBatch?: SaleScanBatch
): CartItem {
  const fifo = chosenBatch ?? pickFifoBatch(root);
  const lineKey = `${root.productId}-${fifo.purchaseDetailId}`;
  const vatRate = root.isVatExempt ? 0 : root.vatRate;
  const inStockBatches = (root.availableBatches ?? []).filter((b) => (b.remainingQuantity ?? 0) > 0);
  const hasMultipleBatches =
    Boolean(root.hasMultipleBatches) && inStockBatches.length > 1;

  const batchRem = Math.max(0, Number(fifo.remainingQuantity) || 0);
  const productStock = Math.max(0, Number(root.qtyInStock) || 0);
  const stockCap =
    batchRem > 0 && productStock > 0
      ? Math.min(batchRem, productStock)
      : batchRem > 0
        ? batchRem
        : productStock;

  return {
    cartLineId: newCartLineId(),
    lineKey,
    productId: root.productId,
    purchaseDetailId: fifo.purchaseDetailId,
    productCode: root.productCode,
    name: root.productName,
    sku: root.productCode,
    barcode: String(root.barcode ?? "").trim(),
    unitOfMeasurement: root.unitOfMeasurement,
    batchNumber: fifo.batchNumber,
    expiryDate: fifo.expiryDate ?? null,
    unitPriceIncVat: fifo.sellingPrice,
    unitPriceExVat: fifo.sellingPriceExVat,
    vatRate,
    isVatExempt: root.isVatExempt,
    quantity: 1,
    maxQuantity: stockCap,
    qtyInStock: productStock,
    discountType: "fixed",
    discountValue: 0,
    hasMultipleBatches,
    availableBatches: inStockBatches.length > 0 ? inStockBatches : [fifo],
  };
}
