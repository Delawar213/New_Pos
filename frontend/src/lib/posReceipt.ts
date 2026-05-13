import type { RootState } from "@/store";
import type { CartItem } from "@/store/slices/cart/cart.slice";
import { lineGrossAfterLineDiscount } from "@/store/slices/cart/cart.slice";
import { mapApiSalePayloadToSale } from "@/store/slices/sale/sale.slice";
import type { Sale } from "@/types/sale";
import { formatCurrency } from "@/lib/utils";

export interface PosReceiptLine {
  name: string;
  code: string;
  quantity: number;
  unitPriceIncVat: number;
  lineTotalIncVat: number;
}

export interface PosReceiptSnapshot {
  storeName: string;
  invoiceNo: string;
  saleId: number | null;
  saleDate: string;
  printedAt: string;
  customerName: string;
  customerId: number;
  saleModeLabel: string;
  receiveIntoLabel: string;
  lines: PosReceiptLine[];
  itemCount: number;
  netExVat: number;
  vatTotal: number;
  saleDiscount: number;
  grandTotal: number;
  paidAmount: number;
  changeDue: number;
  onAccountAmount: number;
  note: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveReceiveIntoLabel(
  accountId: number,
  cashId: number,
  accounts: { bankAccountId: number; accountName: string; accountType: string }[]
): string {
  if (accountId === cashId) return "Cash";
  const row = accounts.find((a) => a.bankAccountId === accountId);
  if (row) return `${row.accountName} (${row.accountType})`;
  return accountId > 0 ? `Account #${accountId}` : "—";
}

function parseSaleMetaFromApi(apiData: unknown): {
  invoiceNo: string;
  saleId: number | null;
  saleDate: string;
} {
  const mapped = mapApiSalePayloadToSale(apiData);
  if (mapped) {
    return {
      invoiceNo: mapped.invoiceNo?.trim() || "Receipt",
      saleId: mapped.id > 0 ? mapped.id : null,
      saleDate: mapped.saleDate || mapped.createdAt || new Date().toISOString(),
    };
  }
  if (apiData != null && typeof apiData === "object") {
    const o = apiData as Record<string, unknown>;
    const id = Number(o.saleId ?? o.id);
    return {
      invoiceNo: String(o.invoiceNumber ?? o.invoiceNo ?? "").trim() || "Receipt",
      saleId: Number.isFinite(id) && id > 0 ? id : null,
      saleDate: String(o.saleDate ?? o.createdDatetime ?? new Date().toISOString()),
    };
  }
  return {
    invoiceNo: "Receipt",
    saleId: null,
    saleDate: new Date().toISOString(),
  };
}

export function buildPosReceiptSnapshot(params: {
  cart: RootState["cart"];
  items: CartItem[];
  bankDropdownAccounts: { bankAccountId: number; accountName: string; accountType: string }[];
  cashDepositAccountId: number;
  grandTotal: number;
  paidAmount: number;
  onAccountAmount: number;
  changeDue: number;
  netExVat: number;
  vatTotal: number;
  saleDiscountAmount: number;
  apiData: unknown;
}): PosReceiptSnapshot {
  const { cart, items } = params;
  const meta = parseSaleMetaFromApi(params.apiData);
  const storeName =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_STORE_NAME?.trim()) ||
    "Point of Sale";

  const saleModeLabel =
    cart.paymentMethod === "credit" ? "Credit sale" : "Walking customer";

  const receiveIntoLabel = resolveReceiveIntoLabel(
    cart.posBankAccountId >= params.cashDepositAccountId
      ? cart.posBankAccountId
      : params.cashDepositAccountId,
    params.cashDepositAccountId,
    params.bankDropdownAccounts
  );

  const lines: PosReceiptLine[] = items.map((item) => ({
    name: item.name,
    code: item.productCode ?? "",
    quantity: item.quantity,
    unitPriceIncVat: round2(Number(item.unitPriceIncVat ?? 0)),
    lineTotalIncVat: round2(lineGrossAfterLineDiscount(item)),
  }));

  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  return {
    storeName,
    invoiceNo: meta.invoiceNo,
    saleId: meta.saleId,
    saleDate: meta.saleDate,
    printedAt: new Date().toISOString(),
    customerName: cart.customerName || "—",
    customerId: cart.customerId,
    saleModeLabel,
    receiveIntoLabel,
    lines,
    itemCount,
    netExVat: round2(params.netExVat),
    vatTotal: round2(params.vatTotal),
    saleDiscount: round2(params.saleDiscountAmount),
    grandTotal: round2(params.grandTotal),
    paidAmount: round2(params.paidAmount),
    changeDue: round2(params.changeDue),
    onAccountAmount: round2(params.onAccountAmount),
    note: (cart.note || "").trim(),
  };
}

/** Build a printable receipt from a normalized `Sale` (e.g. after `fetchSaleById`). */
export function buildPosReceiptSnapshotFromSale(sale: Sale): PosReceiptSnapshot {
  const storeName =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_STORE_NAME?.trim()) ||
    "Point of Sale";

  const customerId = sale.customerId ?? 0;
  const isWalkIn = customerId === 1;
  const saleModeLabel = isWalkIn ? "Walking customer" : "Credit sale";
  const payStatus = (sale.paymentMethod ?? "").trim();
  const receiveIntoLabel = payStatus ? `Payment: ${payStatus}` : "—";

  const lines: PosReceiptLine[] = (sale.items ?? []).map((it) => {
    const qty = Math.max(1, it.quantity);
    const lineTotal = round2(it.total);
    const unitInc = qty > 0 ? round2(lineTotal / qty) : 0;
    return {
      name: it.productName ?? "—",
      code: it.sku ?? "",
      quantity: it.quantity,
      unitPriceIncVat: unitInc,
      lineTotalIncVat: lineTotal,
    };
  });

  const itemCount = (sale.items ?? []).reduce((a, i) => a + i.quantity, 0);
  const grandTotal = round2(sale.grandTotal);
  const paidAmount = round2(sale.paidAmount);
  const onAccountAmount = round2(sale.dueAmount);
  const changeFromApi = round2(sale.changeAmount);
  const changeDue =
    changeFromApi > 0 ? changeFromApi : round2(Math.max(0, paidAmount - grandTotal));

  return {
    storeName,
    invoiceNo: sale.invoiceNo?.trim() || "Receipt",
    saleId: sale.id > 0 ? sale.id : null,
    saleDate: sale.saleDate || sale.createdAt,
    printedAt: new Date().toISOString(),
    customerName: sale.customerName ?? "—",
    customerId,
    saleModeLabel,
    receiveIntoLabel,
    lines,
    itemCount,
    netExVat: round2(sale.subtotal),
    vatTotal: round2(sale.taxAmount),
    saleDiscount: round2(sale.discountAmount),
    grandTotal,
    paidAmount,
    changeDue,
    onAccountAmount,
    note: (sale.note ?? "").trim(),
  };
}

function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildReceiptPrintHtml(r: PosReceiptSnapshot): string {
  const rows = r.lines
    .map(
      (line) => `
    <tr>
      <td class="c-qty">${line.quantity}</td>
      <td class="c-item">
        <div class="name">${escapeHtml(line.name)}</div>
        ${line.code ? `<div class="code">${escapeHtml(line.code)}</div>` : ""}
      </td>
      <td class="c-amt">${escapeHtml(formatCurrency(line.unitPriceIncVat))}</td>
      <td class="c-amt">${escapeHtml(formatCurrency(line.lineTotalIncVat))}</td>
    </tr>`
    )
    .join("");

  const noteBlock = r.note
    ? `<div class="note"><strong>Note</strong><br/>${escapeHtml(r.note)}</div>`
    : "";

  const saleIdRow =
    r.saleId != null
      ? `<div class="meta-row"><span>Sale ID</span><span>#${r.saleId}</span></div>`
      : "";

  const onAccountRow =
    r.onAccountAmount > 0
      ? `<div class="tot-row"><span>On account</span><span>${escapeHtml(formatCurrency(r.onAccountAmount))}</span></div>`
      : "";

  const changeRow =
    r.changeDue > 0
      ? `<div class="tot-row change"><span>Change</span><span>${escapeHtml(formatCurrency(r.changeDue))}</span></div>`
      : "";

  const discountRow =
    r.saleDiscount > 0
      ? `<div class="tot-row"><span>Sale discount</span><span>−${escapeHtml(formatCurrency(r.saleDiscount))}</span></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(r.invoiceNo)} — Receipt</title>
  <style>
    * { box-sizing: border-box; }
    @page { margin: 10mm; size: auto; }
    body {
      margin: 0 auto;
      padding: 16px 14px 24px;
      max-width: 400px;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .brand {
      text-align: center;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .subbrand { text-align: center; font-size: 10px; color: #64748b; margin-bottom: 12px; }
    .rule { border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0; }
    .invoice {
      text-align: center;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 4px 0 2px;
    }
    .when { text-align: center; font-size: 10px; color: #64748b; margin-bottom: 10px; }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 3px 0;
      font-size: 10px;
      color: #334155;
    }
    .meta-row span:last-child { text-align: right; font-weight: 600; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 4px;
      font-size: 10px;
    }
    table.items th {
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding: 6px 4px 4px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    table.items th:nth-child(3), table.items th:nth-child(4) { text-align: right; }
    table.items td {
      vertical-align: top;
      padding: 8px 6px 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .c-qty { width: 28px; text-align: right; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .c-item .name { font-weight: 600; color: #0f172a; }
    .c-item .code { font-size: 9px; color: #94a3b8; font-family: ui-monospace, monospace; margin-top: 2px; }
    .c-amt { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; color: #334155; }
    .totals { margin-top: 10px; padding-top: 8px; border-top: 2px solid #0f172a; }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11px;
      color: #334155;
    }
    .tot-row.grand {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
    }
    .tot-row.change span:last-child { color: #047857; font-weight: 700; }
    .note {
      margin-top: 12px;
      padding: 8px 10px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 10px;
      color: #475569;
    }
    .footer {
      margin-top: 18px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="brand">${escapeHtml(r.storeName)}</div>
  <div class="subbrand">Sales receipt</div>
  <hr class="rule" />
  <div class="invoice">${escapeHtml(r.invoiceNo)}</div>
  <div class="when">${escapeHtml(formatReceiptDate(r.saleDate))}</div>
  <div class="meta-row"><span>Printed</span><span>${escapeHtml(formatReceiptDate(r.printedAt))}</span></div>
  ${saleIdRow}
  <div class="meta-row"><span>Customer</span><span>${escapeHtml(r.customerName)}${r.customerId ? ` · #${r.customerId}` : ""}</span></div>
  <div class="meta-row"><span>Sale type</span><span>${escapeHtml(r.saleModeLabel)}</span></div>
  <div class="meta-row"><span>Received into</span><span>${escapeHtml(r.receiveIntoLabel)}</span></div>
  <hr class="rule" />
  <table class="items" aria-label="Line items">
    <thead><tr>
      <th>Qty</th><th>Item</th><th>Each</th><th>Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="tot-row"><span>Items</span><span>${r.itemCount}</span></div>
    <div class="tot-row"><span>Net (ex VAT)</span><span>${escapeHtml(formatCurrency(r.netExVat))}</span></div>
    <div class="tot-row"><span>VAT</span><span>${escapeHtml(formatCurrency(r.vatTotal))}</span></div>
    ${discountRow}
    <div class="tot-row grand"><span>Total (inc VAT)</span><span>${escapeHtml(formatCurrency(r.grandTotal))}</span></div>
    <div class="tot-row"><span>Paid</span><span>${escapeHtml(formatCurrency(r.paidAmount))}</span></div>
    ${onAccountRow}
    ${changeRow}
  </div>
  ${noteBlock}
  <div class="footer">Thank you for your business.</div>
</body>
</html>`;
}

/**
 * Print receipt without opening a new tab (avoids pop-up blockers and blank `about:blank`).
 * Uses a hidden iframe in the current document.
 */
export function printPosReceipt(r: PosReceiptSnapshot): void {
  if (typeof document === "undefined") return;

  const html = buildReceiptPrintHtml(r);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Receipt print");
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

  // Many browsers do not fire `load` for programmatically written iframe docs
  requestAnimationFrame(() => {
    setTimeout(runPrint, 50);
  });
}

/** @deprecated Use {@link printPosReceipt} — kept for any older imports. */
export const openPosReceiptPrintWindow = printPosReceipt;
