import type { CustomerLedgerEntry } from "@/types/customer";
import { summarizeCustomerLedger } from "@/lib/customerLedgerUtils";
import {
  buildPrintCompanyFooterHtml,
  buildPrintCompanyHeaderHtml,
  getPrintBranding,
  PRINT_COMPANY_HEADER_STYLES,
} from "@/lib/printBranding";

export interface CustomerLedgerPrintMeta {
  customerCode: string;
  customerName: string;
  fromDate?: string;
  toDate?: string;
  useDateFilter: boolean;
  currentBalance?: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrintedAt(): string {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPrintDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatInputDate(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function amountCell(amount: number): string {
  if (amount <= 0) return '<span class="muted">—</span>';
  return escapeHtml(formatMoney(amount));
}

function buildLedgerPrintHtml(
  entries: CustomerLedgerEntry[],
  meta: CustomerLedgerPrintMeta
): string {
  const branding = getPrintBranding();
  const printedAt = formatPrintedAt();
  const { totalDebit, totalCredit, closingBalance } = summarizeCustomerLedger(entries);

  const periodLine =
    meta.useDateFilter && meta.fromDate && meta.toDate
      ? `Period: ${escapeHtml(formatInputDate(meta.fromDate))} — ${escapeHtml(formatInputDate(meta.toDate))}`
      : "Period: All dates";

  const balanceLine =
    meta.currentBalance != null
      ? ` · Current balance: ${escapeHtml(formatMoney(meta.currentBalance))}`
      : "";

  const rows = entries
    .map(
      (row, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${escapeHtml(formatPrintDate(row.transactionDate))}</td>
      <td>${escapeHtml(row.transactionType)}</td>
      <td class="mono">${escapeHtml(row.referenceNo || "—")}</td>
      <td>${escapeHtml(row.description || "—")}</td>
      <td class="num dr">${amountCell(row.debit)}</td>
      <td class="num cr">${amountCell(row.credit)}</td>
      <td class="num bal">${escapeHtml(formatMoney(row.balance))}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Customer ledger — ${escapeHtml(meta.customerName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 10px;
      color: #0f172a;
      margin: 0;
      padding: 16px 20px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    ${PRINT_COMPANY_HEADER_STYLES}
    .title { font-size: 14px; font-weight: 600; color: #334155; margin: 8px 0 0; }
    .party { margin-top: 6px; font-size: 12px; font-weight: 600; }
    .meta { margin-top: 8px; font-size: 10px; color: #64748b; line-height: 1.5; }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin-bottom: 14px;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 10px;
    }
    .summary span strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
    }
    td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    td.mono { font-family: ui-monospace, monospace; font-size: 9px; }
    td.dr .muted, td.cr .muted { color: #94a3b8; }
    tr:nth-child(even) td { background: #fafafa; }
    tfoot td {
      font-weight: 700;
      background: #f1f5f9;
      border-top: 2px solid #94a3b8;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
    }
    @media print {
      body { padding: 8px; }
      @page { margin: 12mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${buildPrintCompanyHeaderHtml(branding)}
    <p class="title">Customer account ledger</p>
    <p class="party">${escapeHtml(meta.customerCode)} — ${escapeHtml(meta.customerName)}</p>
    <p class="meta">${periodLine}<br />Printed ${escapeHtml(printedAt)} · ${entries.length} entr${entries.length === 1 ? "y" : "ies"}${balanceLine}</p>
  </div>
  <div class="summary">
    <span>Total debit: <strong>${escapeHtml(formatMoney(totalDebit))}</strong></span>
    <span>Total credit: <strong>${escapeHtml(formatMoney(totalCredit))}</strong></span>
    <span>Closing balance: <strong>${escapeHtml(formatMoney(closingBalance))}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Type</th>
        <th>Reference</th>
        <th>Description</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="8" style="text-align:center;padding:16px;color:#64748b">No entries</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;text-transform:uppercase;font-size:8px;color:#64748b">Period totals</td>
        <td class="num">${escapeHtml(formatMoney(totalDebit))}</td>
        <td class="num">${escapeHtml(formatMoney(totalCredit))}</td>
        <td class="num">${escapeHtml(formatMoney(closingBalance))}</td>
      </tr>
    </tfoot>
  </table>
  <p class="footer">Customer ledger statement · ${escapeHtml(meta.customerName)} · ${escapeHtml(branding.storeName)}</p>
  ${buildPrintCompanyFooterHtml(branding)}
</body>
</html>`;
}

function printHtmlDocument(html: string, iframeTitle: string): void {
  if (typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", iframeTitle);
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;margin:0;padding:0;opacity:0;pointer-events:none;";

  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  const iwin = iframe.contentWindow;
  if (!idoc || !iwin) {
    iframe.remove();
    return;
  }

  let printed = false;
  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  };

  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iwin.focus();
      iwin.print();
    } catch {
      /* ignore */
    }
    setTimeout(cleanup, 1000);
  };

  iframe.onload = () => runPrint();
  idoc.open();
  idoc.write(html);
  idoc.close();
  requestAnimationFrame(() => setTimeout(runPrint, 50));
}

export function printCustomerLedgerReport(
  entries: CustomerLedgerEntry[],
  meta: CustomerLedgerPrintMeta
): void {
  const html = buildLedgerPrintHtml(entries, meta);
  printHtmlDocument(html, `Customer ledger — ${meta.customerName}`);
}
