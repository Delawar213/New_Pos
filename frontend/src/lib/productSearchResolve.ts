/** Product code e.g. PRD075, PRD001 */
export function isProductCodeQuery(term: string): boolean {
  return /^PRD\d{3,}$/i.test(term.trim());
}

/** Barcode / SKU scan style lookup (not a product code, no spaces). */
export function isBarcodeQuery(term: string): boolean {
  const t = term.trim();
  if (t.length < 2 || /\s/.test(t)) return false;
  if (isProductCodeQuery(t)) return false;
  return /^[\w.-]+$/i.test(t);
}
