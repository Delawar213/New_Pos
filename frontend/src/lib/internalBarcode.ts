/**
 * Internal shelf barcodes for products without supplier labels (e.g. tomato, chicken).
 * Range 200001–299999 — scan at POS like any other barcode (CODE128).
 */

export const INTERNAL_BARCODE_MIN = 200001;
export const INTERNAL_BARCODE_MAX = 299999;

export function isInternalBarcode(barcode: string | null | undefined): boolean {
  const bc = (barcode ?? "").trim();
  if (!/^200\d{3,6}$/.test(bc)) return false;
  const n = parseInt(bc, 10);
  return Number.isFinite(n) && n >= INTERNAL_BARCODE_MIN && n <= INTERNAL_BARCODE_MAX;
}

/** Next free code in the internal range from existing product barcodes. */
export function suggestNextInternalBarcode(
  products: { barcode?: string | null }[]
): string {
  let max = INTERNAL_BARCODE_MIN - 1;
  for (const p of products) {
    const bc = (p.barcode ?? "").trim();
    if (!bc) continue;
    const n = parseInt(bc, 10);
    if (
      Number.isFinite(n) &&
      n >= INTERNAL_BARCODE_MIN &&
      n <= INTERNAL_BARCODE_MAX
    ) {
      max = Math.max(max, n);
    }
  }
  const next = max + 1;
  if (next > INTERNAL_BARCODE_MAX) {
    return String(INTERNAL_BARCODE_MIN);
  }
  return String(next);
}

/** True if another product already uses this barcode (case-insensitive). */
export function barcodeUsedByOther(
  barcode: string,
  products: { productId?: number; barcode?: string | null }[],
  excludeProductId?: number
): boolean {
  const norm = barcode.trim().toLowerCase();
  if (!norm) return false;
  return products.some((p) => {
    if (excludeProductId != null && p.productId === excludeProductId) return false;
    return (p.barcode ?? "").trim().toLowerCase() === norm;
  });
}
