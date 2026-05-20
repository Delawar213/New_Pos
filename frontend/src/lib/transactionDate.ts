export function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfMonthInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Local date (YYYY-MM-DD) → ISO date-time for API query/body. */
export function dateInputToIso(dateStr: string, endOfDay = false): string {
  if (!dateStr) return new Date().toISOString();
  const time = endOfDay ? "T23:59:59" : "T00:00:00";
  const d = new Date(`${dateStr}${time}`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function normalizeTransactionList(data: unknown): import("@/types/transaction").Transaction[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const t = row as Record<string, unknown>;
    const details = Array.isArray(t.transactionDetails) ? t.transactionDetails : [];
    return {
      transactionId: Number(t.transactionId) || 0,
      transactionCode: String(t.transactionCode ?? ""),
      transactionDate: String(t.transactionDate ?? ""),
      title: String(t.title ?? ""),
      description: t.description != null ? String(t.description) : undefined,
      referenceNo: t.referenceNo != null ? String(t.referenceNo) : undefined,
      status: String(t.status ?? ""),
      createdDatetime: String(t.createdDatetime ?? t.transactionDate ?? ""),
      transactionDetails: details.map((d) => {
        const line = d as Record<string, unknown>;
        return {
          detailId: Number(line.detailId) || 0,
          accountType: String(line.accountType ?? ""),
          accountName: String(line.accountName ?? ""),
          refTable: line.refTable != null ? String(line.refTable) : undefined,
          refId: line.refId != null ? Number(line.refId) : undefined,
          bankAccountId: line.bankAccountId != null ? Number(line.bankAccountId) : undefined,
          bankAccountName: line.bankAccountName != null ? String(line.bankAccountName) : undefined,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
          description: line.description != null ? String(line.description) : undefined,
        };
      }),
    };
  });
}
