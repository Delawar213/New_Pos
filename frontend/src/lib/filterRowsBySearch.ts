/**
 * Client-side filter: row matches if any `pickStrings(row)` value includes the query (case-insensitive).
 */
export function filterRowsBySearch<T>(rows: T[], query: string, pickStrings: (row: T) => string[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    pickStrings(row).some((s) => String(s ?? "").toLowerCase().includes(q))
  );
}
