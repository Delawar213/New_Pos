import type { SaleItem } from "@/types/sale";

/** Lines that can still be returned (API rules). */
export function getReturnableSaleLines(
  items: SaleItem[] | undefined
): Array<{ item: SaleItem; maxReturn: number }> {
  return (items ?? [])
    .filter((it) => !it.isReturned)
    .map((it) => {
      const rq = Math.max(0, Math.floor(Number(it.returnQuantity ?? 0)));
      const maxReturn = Math.max(0, Math.floor(Number(it.quantity) || 0) - rq);
      return { item: it, maxReturn };
    })
    .filter((x) => x.maxReturn > 0);
}
