"use client";

import JsBarcode from "jsbarcode";
import type { Product } from "@/types/product";
import { getPrintBranding } from "@/lib/printBranding";
import { formatCurrency } from "@/lib/utils";
import { printHtmlDocument } from "@/lib/productStockPrint";

export interface ProductLabelInput {
  productName: string;
  productCode: string;
  barcode: string;
  unitOfMeasurement?: string;
  /** Price shown on shelf label (inc VAT preferred). */
  priceLabel: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders CODE128 barcode as SVG data URL for print preview. */
export function barcodeToSvgDataUrl(code: string): string {
  if (typeof document === "undefined" || !code.trim()) return "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, code.trim(), {
    format: "CODE128",
    width: 2,
    height: 56,
    displayValue: false,
    margin: 6,
    background: "#ffffff",
  });
  const xml = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

export function productToLabelInput(p: Product): ProductLabelInput | null {
  const barcode = (p.barcode ?? "").trim();
  if (!barcode) return null;
  const inc =
    p.sellingPriceIncVat != null && p.sellingPriceIncVat > 0
      ? p.sellingPriceIncVat
      : p.sellingPrice * (1 + (p.vatRate || 0) / 100);
  const uom = (p.unitOfMeasurement || "Each").trim();
  const priceLabel =
    uom.toLowerCase() === "each" || uom.toLowerCase() === "piece"
      ? formatCurrency(inc)
      : `${formatCurrency(inc)} / ${uom}`;
  return {
    productName: p.productName,
    productCode: p.productCode,
    barcode,
    unitOfMeasurement: uom,
    priceLabel,
  };
}

function buildLabelHtml(
  labels: ProductLabelInput[],
  copiesPerProduct: number,
  barcodeImages: Record<string, string>
): string {
  const branding = getPrintBranding();
  const store = escapeHtml(branding.storeName);
  const printedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cells: string[] = [];
  for (const label of labels) {
    const img = barcodeImages[label.barcode] ?? "";
    for (let c = 0; c < copiesPerProduct; c++) {
      cells.push(`
        <div class="label">
          <p class="store">${store}</p>
          <p class="name">${escapeHtml(label.productName)}</p>
          <p class="meta">${escapeHtml(label.productCode)} · ${escapeHtml(label.priceLabel)}</p>
          ${img ? `<img class="bars" src="${img}" alt="" />` : ""}
          <p class="bc">${escapeHtml(label.barcode)}</p>
        </div>`);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Shelf labels</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      margin: 0;
      padding: 10mm;
      color: #0f172a;
    }
    .sheet-meta {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6mm;
    }
    .label {
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      padding: 3mm 4mm 4mm;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
      min-height: 32mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }
    .store {
      margin: 0;
      font-size: 7px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .name {
      margin: 2px 0 0;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.2;
      max-height: 2.4em;
      overflow: hidden;
      width: 100%;
    }
    .meta {
      margin: 2px 0 4px;
      font-size: 9px;
      color: #475569;
      width: 100%;
    }
    .bars {
      max-width: 100%;
      height: 14mm;
      object-fit: contain;
    }
    .bc {
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 600;
      font-family: ui-monospace, monospace;
      letter-spacing: 0.08em;
    }
    @media print {
      body { padding: 8mm; }
      .sheet-meta { display: none; }
      .label { border: 1px solid #e2e8f0; }
      @page { margin: 8mm; size: A4; }
    }
  </style>
</head>
<body>
  <p class="sheet-meta">Shelf labels · ${escapeHtml(printedAt)} · ${cells.length} sticker${cells.length === 1 ? "" : "s"}</p>
  <div class="grid">${cells.join("")}</div>
</body>
</html>`;
}

/** Open browser print dialog with shelf labels (3 per row on A4). */
export function printProductShelfLabels(
  products: Product[],
  copiesPerProduct = 1
): { ok: boolean; message?: string } {
  const copies = Math.min(99, Math.max(1, Math.floor(copiesPerProduct)));
  const labels: ProductLabelInput[] = [];
  for (const p of products) {
    const row = productToLabelInput(p);
    if (row) labels.push(row);
  }
  if (labels.length === 0) {
    return {
      ok: false,
      message: "No products with a barcode to print. Generate an internal barcode first.",
    };
  }

  const barcodeImages: Record<string, string> = {};
  for (const label of labels) {
    if (!barcodeImages[label.barcode]) {
      barcodeImages[label.barcode] = barcodeToSvgDataUrl(label.barcode);
    }
  }

  const html = buildLabelHtml(labels, copies, barcodeImages);
  printHtmlDocument(html, "Shelf labels");
  return { ok: true };
}
