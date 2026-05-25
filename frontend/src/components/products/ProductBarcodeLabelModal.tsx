"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Printer, Barcode } from "lucide-react";
import { Modal } from "@/components/ui";
import type { Product } from "@/types/product";
import {
  barcodeToSvgDataUrl,
  printProductShelfLabels,
  productToLabelInput,
} from "@/lib/productLabelPrint";
import { isInternalBarcode } from "@/lib/internalBarcode";

interface ProductBarcodeLabelModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
}

export function ProductBarcodeLabelModal({
  open,
  onClose,
  products,
}: ProductBarcodeLabelModalProps) {
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (open) setCopies(1);
  }, [open]);

  const printable = useMemo(
    () => products.map((p) => ({ product: p, label: productToLabelInput(p) })).filter((x) => x.label),
    [products]
  );

  const preview = printable[0]?.label;
  const previewImg = preview ? barcodeToSvgDataUrl(preview.barcode) : "";

  const handlePrint = () => {
    const result = printProductShelfLabels(
      printable.map((x) => x.product),
      copies
    );
    if (!result.ok) {
      window.alert(result.message ?? "Could not print labels.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print shelf labels"
      description="Stick labels on bins or bags — cashiers scan the barcode at POS like packaged goods."
      size="md"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="label-copies" className="text-xs font-medium text-slate-600">
              Copies each
            </label>
            <input
              id="label-copies"
              type="number"
              min={1}
              max={99}
              value={copies}
              onChange={(e) => setCopies(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
              className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-sm tabular-nums"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={printable.length === 0}
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print {printable.length > 1 ? `${printable.length} products` : "label"}
            </button>
          </div>
        </div>
      }
    >
      {printable.length === 0 ? (
        <p className="text-sm text-amber-800">
          None of the selected products have a barcode. Use <strong>Generate internal barcode</strong> on
          the product form, save, then print.
        </p>
      ) : (
        <div className="space-y-4">
          {printable.length > 1 ? (
            <p className="text-sm text-slate-600">
              {printable.length} products with barcodes will print ({copies} label
              {copies !== 1 ? "s" : ""} each).
            </p>
          ) : null}
          {preview ? (
            <div className="mx-auto max-w-xs rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Preview
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">{preview.productName}</p>
              <p className="text-xs text-slate-500">
                {preview.productCode} · {preview.priceLabel}
              </p>
              {previewImg ? (
                <img src={previewImg} alt="" className="mx-auto mt-2 max-h-16 w-full object-contain" />
              ) : null}
              <p className="mt-2 font-mono text-sm font-semibold tracking-wider text-slate-800">
                {preview.barcode}
                {isInternalBarcode(preview.barcode) ? (
                  <span className="ml-1 text-[10px] font-normal text-emerald-600">internal</span>
                ) : null}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-slate-500">
            Layout: 3 labels per row on A4. Trim and place on shelf. Scan at POS with the barcode field.
          </p>
        </div>
      )}
    </Modal>
  );
}
