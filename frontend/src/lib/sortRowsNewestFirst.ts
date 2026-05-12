/**
 * Sort table rows with newest first: prefer known date fields, then highest *Id.
 */
const DATE_KEYS = [
  "createdDatetime",
  "createdAt",
  "CreatedDatetime",
  "createdDate",
  "purchaseDate",
  "transactionDate",
  "saleDate",
  "dateOfJoining",
  "updatedDatetime",
  "updatedAt",
] as const;

function rowTimestamp(row: Record<string, unknown>): number {
  for (const k of DATE_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) {
      const t = Date.parse(v);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

function rowBestId(row: Record<string, unknown>): number {
  let max = 0;
  for (const [k, v] of Object.entries(row)) {
    if (!/Id$/i.test(k)) continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max;
}

export function sortRowsNewestFirst<T>(rows: T[]): T[] {
  if (!Array.isArray(rows) || rows.length < 2) return rows;
  return [...rows].sort((a, b) => {
    const ra = a as Record<string, unknown>;
    const rb = b as Record<string, unknown>;
    const ta = rowTimestamp(ra);
    const tb = rowTimestamp(rb);
    if (ta !== tb) return tb - ta;
    return rowBestId(rb) - rowBestId(ra);
  });
}
