import type { Product } from "@/types/product";
import {
  buildPrintCompanyFooterHtml,
  buildPrintCompanyHeaderHtml,
  getPrintBranding,
  PRINT_COMPANY_HEADER_STYLES,
} from "@/lib/printBranding";

export type StockPrintKind = "outofstock" | "lowstock";

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

function reportTitle(kind: StockPrintKind): string {
  return kind === "outofstock" ? "Out of stock report" : "Low stock report";
}

function buildStockPrintHtml(kind: StockPrintKind, products: Product[]): string {
  const branding = getPrintBranding();
  const title = reportTitle(kind);
  const printedAt = formatPrintedAt();

  const rows = products
    .map(
      (p, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td><strong>${escapeHtml(p.productCode)}</strong></td>
      <td>${escapeHtml(p.productName)}</td>
      <td>${escapeHtml(p.categoryName ?? "—")}</td>
      <td class="num">${p.qtyInStock}</td>
      <td class="num">${p.stockAlertLevel ?? "—"}</td>
      <td class="num">${p.reorderLevel ?? "—"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11px;
      color: #0f172a;
      margin: 0;
      padding: 16px 20px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .store { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .title { font-size: 14px; font-weight: 600; color: #334155; margin: 0; }
    .meta { margin-top: 8px; font-size: 10px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
    }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
    }
    @media print {
      body { padding: 8px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${buildPrintCompanyHeaderHtml(branding)}
    <p class="title">${escapeHtml(title)}</p>
    <p class="meta">Printed ${escapeHtml(printedAt)} · ${products.length} product${products.length === 1 ? "" : "s"}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Code</th>
        <th>Product</th>
        <th>Category</th>
        <th>Qty</th>
        <th>Alert level</th>
        <th>Reorder</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" style="text-align:center;padding:16px;color:#64748b">No products</td></tr>'}
    </tbody>
  </table>
  <p class="footer">Generated from POS inventory · ${escapeHtml(title)} · ${escapeHtml(branding.storeName)}</p>
  ${buildPrintCompanyFooterHtml(branding)}
</body>
</html>`;
}

export function printHtmlDocument(html: string, iframeTitle: string): void {
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

/** Print low-stock or out-of-stock product list (iframe, no new tab). */
export function printProductStockReport(kind: StockPrintKind, products: Product[]): void {
  const html = buildStockPrintHtml(kind, products);
  printHtmlDocument(html, `${reportTitle(kind)} print`);
}
