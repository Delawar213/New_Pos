"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Barcode,
  Camera,
  Minus,
  Plus,
  Trash2,
  Loader2,
  Receipt,
  CreditCard,
  Banknote,
  Building2,
  Wallet,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { buildCartItemFromScan, incVatToExVat, selectBatchForNextScan } from "@/lib/saleScan";
import type { CreatePosSaleRequest } from "@/types/sale";
import type { SaleScanBatch } from "@/types/sale";
import type { CustomerDropdown } from "@/types/customer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { store } from "@/store";
import type { RootState } from "@/store";
import { addToast } from "@/store/slices/ui/ui.slice";
import {
  addToCart,
  clearCart,
  removeFromCart,
  setCustomer,
  setCartDiscount,
  setNote,
  setPaidAmount,
  setPaymentMethod,
  setPosBankAccountId,
  updateQuantity,
  updateItemDiscount,
  sanitizeCartLinesForPos,
  switchLineBatch,
  setLineSellingPrices,
  lineGrossAfterLineDiscount,
  lineDiscountAmountForApi,
  selectCartTotal,
  selectCartNetExVatTotal,
  selectCartVatTotal,
  selectCartGrossBeforeCartDiscount,
  type CartItem,
} from "@/store/slices/cart/cart.slice";
import { createSale, scanPosBarcode, validatePosPriceOverride } from "@/store/slices/sale/sale.slice";
import { fetchCustomersDropdown } from "@/store/slices/customer/customer.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { BarcodeCameraScanner } from "@/components/pos/BarcodeCameraScanner";

/** Default retail / walk-in customer id expected by the sales API. */
const WALK_IN_CUSTOMER_ID = 1;

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "credit", label: "Credit", icon: Wallet },
  { value: "bank", label: "Bank", icon: Building2 },
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

function cartLevelDiscountAmount(cart: RootState["cart"]): number {
  const gross = cart.items.reduce((s, i) => s + lineGrossAfterLineDiscount(i), 0);
  if (gross <= 0) return 0;
  if (cart.discountType === "percentage") {
    return round2((gross * Math.min(100, Math.max(0, cart.discountValue))) / 100);
  }
  return round2(Math.min(cart.discountValue, gross));
}

function cartLevelDiscountPercentage(cart: RootState["cart"]): number {
  const gross = cart.items.reduce((s, i) => s + lineGrossAfterLineDiscount(i), 0);
  if (gross <= 0) return 0;
  if (cart.discountType === "percentage") {
    return round2(Math.min(100, Math.max(0, cart.discountValue)));
  }
  const fixed = round2(Math.min(Math.max(0, cart.discountValue), gross));
  return round2((fixed / gross) * 100);
}

function itemDiscountPercentage(item: CartItem): number {
  if (item.discountType === "percentage") {
    return round2(Math.min(100, Math.max(0, item.discountValue)));
  }
  const gross = Math.max(0, item.unitPriceIncVat * item.quantity);
  if (gross <= 0) return 0;
  const amount = lineDiscountAmountForApi(item);
  return round2((amount / gross) * 100);
}

function buildCreateSaleRequest(cart: RootState["cart"]): CreatePosSaleRequest {
  const items = cart.items.map((item) => ({
    productId: item.productId,
    purchaseDetailId: item.purchaseDetailId,
    quantity: item.quantity,
    sellingPriceExVat: round2(item.unitPriceExVat),
    itemDiscountAmount: round2(lineDiscountAmountForApi(item)),
    itemDiscountPercentage: itemDiscountPercentage(item),
  }));

  const grandTotal = round2(selectCartTotal({ cart }));
  const tender = round2(Math.max(0, cart.paidAmount));
  /** Cash applied to this invoice (credit sales: remainder stays on customer account). */
  let paidForApi = tender;
  if (cart.paymentMethod === "credit") {
    paidForApi = round2(Math.min(tender, grandTotal));
  }

  let description = cart.note.trim() || "POS sale";
  if (cart.paymentMethod === "credit") {
    const onAccount = round2(Math.max(0, grandTotal - paidForApi));
    if (paidForApi > 0 && onAccount > 0) {
      description = [description, `Part cash ${paidForApi}; on account ${onAccount}`].join(" · ");
    } else if (onAccount > 0 && paidForApi <= 0) {
      description = [description, `On account ${onAccount}`].join(" · ");
    }
  }

  return {
    customerId: cart.customerId,
    discountAmount: cartLevelDiscountAmount(cart),
    discountPercentage: cartLevelDiscountPercentage(cart),
    description,
    createdBy: 0,
    items,
    payment: {
      bankAccountId:
        cart.paymentMethod === "bank"
          ? cart.posBankAccountId
          : cart.paymentMethod === "cash"
            ? 1
            : 0,
      paidAmount: paidForApi,
    },
  };
}

function batchSelectLabel(b: SaleScanBatch, selectedId: number): string {
  const mon = b.expiryDate
    ? new Date(b.expiryDate).toLocaleDateString("en-GB", { month: "short" })
    : "—";
  const mark = b.purchaseDetailId === selectedId ? " ✓" : "";
  return `Batch ${b.batchNumber} (${mon}) — ${formatCurrency(b.sellingPrice)}${mark}`;
}

export default function POSPage() {
  const dispatch = useAppDispatch();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const scanLockRef = useRef(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const items = useAppSelector((s) => s.cart.items);
  const cart = useAppSelector((s) => s.cart);
  const paymentMethod = cart.paymentMethod;
  const paidAmount = cart.paidAmount;
  const customerId = cart.customerId;
  const customerName = cart.customerName;
  const posBankAccountId = cart.posBankAccountId;
  const note = cart.note;
  const dropdownCustomers = useAppSelector((s) => s.customer.dropdownCustomers);
  const bankDropdownAccounts = useAppSelector((s) => s.bankAccount.dropdownAccounts);
  const saleDiscountType = cart.discountType;
  const saleDiscountValue = cart.discountValue;
  const actionLoading = useAppSelector((s) => s.sale.actionLoading);

  const netExVat = useAppSelector(selectCartNetExVatTotal);
  const vatTotal = useAppSelector(selectCartVatTotal);
  const grossBeforeCartDisc = useAppSelector(selectCartGrossBeforeCartDiscount);
  const grandTotal = useAppSelector(selectCartTotal);
  const saleDiscountAmount = cartLevelDiscountAmount(cart);

  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    dispatch(sanitizeCartLinesForPos());
  }, [dispatch]);

  const applyPaymentMethod = useCallback(
    (value: string) => {
      dispatch(setPaymentMethod(value));
      if (value === "credit") {
        dispatch(setPaidAmount(0));
        void dispatch(fetchCustomersDropdown());
        return;
      }
      if (value === "bank") {
        void dispatch(fetchBankAccountsDropdown());
      }
      dispatch(setCustomer({ id: WALK_IN_CUSTOMER_ID, name: "Walk-in" }));
      if (value !== "bank") {
        dispatch(setPosBankAccountId(0));
      }
      if (value === "cash" || value === "card" || value === "bank") {
        const gt = round2(selectCartTotal(store.getState()));
        dispatch(setPaidAmount(gt));
      }
    },
    [dispatch]
  );

  const submitScanWithCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code || scanLockRef.current) return;
      scanLockRef.current = true;
      setScanning(true);
      setBarcodeInput(code);
      try {
        const result = await dispatch(scanPosBarcode(code));
        if (scanPosBarcode.rejected.match(result)) {
          dispatch(
            addToast({
              type: "error",
              title: "Scan failed",
              message:
                typeof result.payload === "string" ? result.payload : "Unknown error",
            })
          );
          return;
        }
        const data = result.payload;
        if (!data) return;

        const normBc = (b: string | undefined) => String(b ?? "").trim();
        const beforeItems = store.getState().cart.items;
        const batch = selectBatchForNextScan(data, beforeItems);
        if (!batch) {
          dispatch(
            addToast({
              type: "warning",
              title: "Out of stock",
              message: data.productName,
            })
          );
          return;
        }

        const newLine = buildCartItemFromScan(data, batch);
        const matchLine = (i: CartItem) =>
          i.lineKey === newLine.lineKey ||
          (i.productId === newLine.productId &&
            normBc(i.barcode) === normBc(newLine.barcode) &&
            i.purchaseDetailId === newLine.purchaseDetailId);

        const sameSkuBefore = beforeItems.filter(
          (c) => c.productId === data.productId && normBc(c.barcode) === normBc(data.barcode)
        );
        const alreadyHadThisBatch = sameSkuBefore.some(
          (c) => c.purchaseDetailId === batch.purchaseDetailId
        );
        const rolledToNextBatch = !alreadyHadThisBatch && sameSkuBefore.length > 0;

        const prevRow = beforeItems.find(matchLine);
        const prevQty = prevRow?.quantity ?? 0;

        dispatch(addToCart(newLine));

        const afterItems = store.getState().cart.items;
        const row = afterItems.find(matchLine);
        const newQty = row?.quantity ?? 0;
        const capped = prevQty > 0 && newQty === prevQty;

        if (capped) {
          dispatch(
            addToast({
              type: "warning",
              title: "Stock limit",
              message: `${data.productName}: already at max available (${row?.maxQuantity ?? 0}).`,
              duration: 3500,
            })
          );
        } else if (prevQty > 0) {
          dispatch(
            addToast({
              type: "success",
              title: "Quantity +1",
              message: `${data.productName} → ${newQty} in cart`,
              duration: 2000,
            })
          );
        } else if (rolledToNextBatch) {
          dispatch(
            addToast({
              type: "success",
              title: "Next batch (FIFO)",
              message: `${data.productName} — batch ${batch.batchNumber} × ${newQty}`,
              duration: 2500,
            })
          );
        } else {
          dispatch(
            addToast({
              type: "success",
              title: "Added",
              message: `${data.productName} × ${newQty}`,
              duration: 2000,
            })
          );
        }
      } finally {
        scanLockRef.current = false;
        setScanning(false);
        setBarcodeInput("");
        barcodeRef.current?.focus();
      }
    },
    [dispatch]
  );

  const submitScan = useCallback(() => {
    void submitScanWithCode(barcodeInput);
  }, [submitScanWithCode, barcodeInput]);

  const tender = round2(Math.max(0, paidAmount));
  const cashAppliedCredit =
    paymentMethod === "credit" ? round2(Math.min(tender, grandTotal)) : tender;
  const onAccountAmount =
    paymentMethod === "credit" ? round2(Math.max(0, grandTotal - cashAppliedCredit)) : 0;
  const changeDue = tender > grandTotal ? round2(tender - grandTotal) : 0;
  const amountDue =
    paymentMethod !== "credit" && grandTotal > tender ? round2(grandTotal - tender) : 0;

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Empty cart",
          message: "Scan items before completing.",
        })
      );
      return;
    }
    if (paymentMethod === "credit" && customerId === WALK_IN_CUSTOMER_ID) {
      dispatch(
        addToast({
          type: "warning",
          title: "Customer required",
          message: "Choose a customer from the list for credit sales.",
        })
      );
      return;
    }
    if (paymentMethod === "bank" && posBankAccountId <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Bank account required",
          message: "Select which bank account this payment was received into.",
        })
      );
      return;
    }
    const payload = buildCreateSaleRequest(cart);
    const result = await dispatch(createSale(payload));
    if (createSale.rejected.match(result)) {
      dispatch(
        addToast({
          type: "error",
          title: "Sale failed",
          message: result.payload || "Could not save sale.",
          duration: 6000,
        })
      );
      return;
    }
    const msg = result.payload?.message || "Sale completed.";
    dispatch(addToast({ type: "success", title: "Sale saved", message: msg }));
    dispatch(clearCart());
    setBarcodeInput("");
    barcodeRef.current?.focus();
  };

  return (
    <>
      <BarcodeCameraScanner
        open={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onDetected={(code) => {
          setCameraScannerOpen(false);
          void submitScanWithCode(code);
        }}
      />
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-slate-50/80 px-2 pb-2 pt-2 sm:gap-3 sm:px-3 sm:pb-3 sm:pt-3">
      <div className="shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="grid w-full grid-cols-1 gap-2 sm:gap-3 md:grid-cols-12 md:items-end">
            <div className="min-w-0 md:col-span-6 lg:col-span-7">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                Barcode
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Scan or type, Enter"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitScan();
                      }
                    }}
                    disabled={scanning}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:h-10 sm:pl-10 sm:text-sm"
                  />
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => setCameraScannerOpen(true)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 sm:flex-initial sm:px-4"
                    title="Scan with device camera"
                  >
                    <Camera className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    disabled={scanning || !barcodeInput.trim()}
                    onClick={() => void submitScan()}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 sm:flex-initial sm:px-5"
                  >
                    {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Add
                  </button>
                </div>
              </div>
              <p className="mt-1 hidden text-[10px] text-slate-500 sm:block sm:text-xs">
                USB scanner: keep this field focused. Camera: use the camera button. Repeat scan adds
                qty; at batch max, scan again for next batch.
              </p>
            </div>
            <div className="min-w-0 md:col-span-4 lg:col-span-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                Customer
              </label>
              {paymentMethod === "credit" ? (
                <CreditCustomerPicker
                  walkInId={WALK_IN_CUSTOMER_ID}
                  options={dropdownCustomers}
                  customerId={customerId}
                  customerName={customerName}
                  onPick={(c) =>
                    dispatch(setCustomer({ id: c.customerId, name: c.customerName }))
                  }
                />
              ) : (
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                  <span className="font-semibold">Walk-in</span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    ID {WALK_IN_CUSTOMER_ID}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end md:col-span-2 lg:col-span-2 md:justify-end md:pb-0.5">
              <Link
                href="/sales"
                className="text-xs font-semibold text-blue-600 underline-offset-2 hover:underline sm:text-sm"
              >
                Sales history
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_min(18rem,92vw)] xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-2 py-2 sm:px-3 sm:py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate text-sm font-bold text-slate-800">Cart</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
                {itemCount}
              </span>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch(clearCart())}
                className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 sm:text-sm"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 sm:py-12">
                Scan a barcode to add a line.
              </p>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {items.map((item, index) => (
                  <LineRow
                    key={item.cartLineId ?? `${item.lineKey ?? "line"}-${index}`}
                    item={item}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex min-h-0 w-full min-w-0 flex-col gap-2 sm:gap-3 lg:max-h-full lg:overflow-y-auto">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-sm sm:p-3 sm:text-sm">
            <div className="space-y-1 border-b border-slate-100 pb-2">
              <Row label="Net (ex VAT)" value={formatCurrency(netExVat)} />
              <Row label="VAT" value={formatCurrency(vatTotal)} />
              {saleDiscountAmount > 0 && (
                <Row label="Sale discount" value={`−${formatCurrency(saleDiscountAmount)}`} muted />
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <select
                value={saleDiscountType}
                onChange={(e) =>
                  dispatch(
                    setCartDiscount({
                      type: e.target.value === "percentage" ? "percentage" : "fixed",
                      value: saleDiscountValue,
                    })
                  )
                }
                className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:px-2 sm:text-sm"
              >
                <option value="fixed">Sale Disc (Amt)</option>
                <option value="percentage">Sale Disc (%)</option>
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                value={saleDiscountValue || ""}
                onChange={(e) =>
                  dispatch(
                    setCartDiscount({
                      type: saleDiscountType,
                      value: Number(e.target.value) || 0,
                    })
                  )
                }
                placeholder={saleDiscountType === "percentage" ? "0 - 100" : "0.00"}
                className="h-9 rounded-md border border-slate-200 px-2 text-right text-xs font-semibold tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center justify-between pt-2 text-base font-bold text-slate-900 sm:text-lg">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
            {cart.discountValue > 0 && grossBeforeCartDisc > grandTotal && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                Before discount: {formatCurrency(grossBeforeCartDisc)}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
            <p className="mb-2 text-xs font-bold text-slate-600 sm:text-sm">Payment</p>
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyPaymentMethod(value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-lg border py-1.5 text-[10px] font-semibold leading-tight transition-colors sm:gap-1 sm:py-2 sm:text-xs",
                    paymentMethod === value
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {label}
                </button>
              ))}
            </div>
            {paymentMethod === "bank" && (
              <div className="mt-2">
                <label className="mb-1 block text-[10px] font-semibold text-slate-500 sm:text-xs">
                  Receive into account
                </label>
                <select
                  value={posBankAccountId || ""}
                  onChange={(e) =>
                    dispatch(setPosBankAccountId(Number(e.target.value) || 0))
                  }
                  className="h-9 w-full max-w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select bank account…</option>
                  {bankDropdownAccounts.map((a) => (
                    <option key={a.bankAccountId} value={a.bankAccountId}>
                      {a.accountName} ({a.accountType})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-600 sm:text-sm">
                {paymentMethod === "credit" ? "Cash paid now" : "Paid"}
              </label>
              {paymentMethod === "credit" && grandTotal > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch(setPaidAmount(grandTotal))}
                  className="text-[10px] font-semibold text-blue-600 hover:underline sm:text-xs"
                >
                  Full cash
                </button>
              )}
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={paidAmount || ""}
              onChange={(e) => dispatch(setPaidAmount(Number(e.target.value) || 0))}
              className="mb-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-right text-lg font-bold tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:h-11 sm:text-xl"
            />
            {paymentMethod === "credit" && (
              <p className="mb-1 text-[10px] leading-snug text-slate-500 sm:text-xs">
                Below total → <span className="font-semibold text-slate-700">on account</span>.
              </p>
            )}
            {paymentMethod === "credit" && onAccountAmount > 0 && (
              <p className="text-xs font-semibold text-indigo-900 sm:text-sm">
                On account: <strong>{formatCurrency(onAccountAmount)}</strong>
              </p>
            )}
            {changeDue > 0 && (
              <p className="mt-0.5 text-xs text-emerald-800 sm:text-sm">
                Change: <strong>{formatCurrency(changeDue)}</strong>
              </p>
            )}
            {amountDue > 0 && (
              <p className="mt-0.5 text-xs text-amber-800 sm:text-sm">
                Due: <strong>{formatCurrency(amountDue)}</strong>
              </p>
            )}
            <label className="mb-1 mt-2 block text-xs font-bold text-slate-600 sm:text-sm">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => dispatch(setNote(e.target.value))}
              placeholder="Optional"
              className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:h-10 sm:px-3 sm:text-sm"
            />
          </div>

          <button
            type="button"
            disabled={items.length === 0 || actionLoading}
            onClick={() => void handleCompleteSale()}
            className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 sm:h-12 sm:rounded-xl sm:text-base"
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Complete sale"
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function CreditCustomerPicker({
  walkInId,
  options,
  customerId,
  customerName,
  onPick,
}: {
  walkInId: number;
  options: CustomerDropdown[];
  customerId: number;
  customerName: string;
  onPick: (c: CustomerDropdown) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const creditOptions = useMemo(
    () => options.filter((c) => c.customerId !== walkInId),
    [options, walkInId]
  );

  useEffect(() => {
    if (customerId === walkInId) return;
    const row = creditOptions.find((c) => c.customerId === customerId);
    if (row) {
      setQuery(`${row.customerName} (${row.customerCode})`);
    }
  }, [customerId, walkInId, creditOptions]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = creditOptions.filter((c) => {
    if (!q) return true;
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.customerTypeName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        placeholder="Search name or code…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search customers for credit sale"
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:h-10 sm:text-sm"
      />
      {customerId !== walkInId && (
        <p className="mt-1 text-[10px] text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{customerName}</span>
        </p>
      )}
      {open && (
        <ul className="absolute left-0 right-0 z-30 mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg sm:max-h-48 sm:text-sm">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">No matching customers.</li>
          ) : (
            filtered.slice(0, 80).map((c) => (
              <li key={c.customerId}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(c);
                    setQuery(`${c.customerName} (${c.customerCode})`);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-slate-900">{c.customerName}</span>
                  <span className="ml-2 tabular-nums text-slate-500">{c.customerCode}</span>
                  {c.customerTypeName ? (
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      {c.customerTypeName}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-2 text-xs sm:text-sm", muted && "text-slate-500")}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-slate-800">{value}</span>
    </div>
  );
}

function LineRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const lineId = item.cartLineId ?? "";
  const isAtQtyLimit = item.quantity >= item.maxQuantity && item.maxQuantity > 0;
  const lineDiscountType = item.discountType ?? "fixed";
  const [priceInput, setPriceInput] = useState(() =>
    Number(item.unitPriceIncVat ?? 0).toFixed(2)
  );
  const [overrideUi, setOverrideUi] = useState<"idle" | "checking" | "allowed" | "blocked">("idle");
  const [overrideHint, setOverrideHint] = useState("");

  useEffect(() => {
    setPriceInput(Number(item.unitPriceIncVat ?? 0).toFixed(2));
    setOverrideUi("idle");
    setOverrideHint("");
  }, [item.cartLineId, item.purchaseDetailId]);

  const batches = item.availableBatches ?? [];
  const batchCount = batches.filter((b) => (b.remainingQuantity ?? 0) > 0).length;
  const showBatchPicker = Boolean(item.hasMultipleBatches) && batchCount > 1;

  const validateAndApplyPrice = async () => {
    if (!lineId) return;
    const n = parseFloat(priceInput);
    if (!Number.isFinite(n) || n < 0) {
      setPriceInput(Number(item.unitPriceIncVat ?? 0).toFixed(2));
      setOverrideUi("idle");
      return;
    }
    const roundedInc = round2(n);
    if (roundedInc === round2(Number(item.unitPriceIncVat ?? 0))) {
      setOverrideUi("idle");
      setOverrideHint("");
      return;
    }

    setOverrideUi("checking");
    setOverrideHint("");
    const exVat = incVatToExVat(roundedInc, item.vatRate, item.isVatExempt);
    try {
      const result = await dispatch(
        validatePosPriceOverride({
          productId: item.productId,
          purchaseDetailId: item.purchaseDetailId,
          proposedSellingPrice: roundedInc,
          proposedSellingPriceExVat: exVat,
          barcode: item.barcode,
        })
      ).unwrap();

      if (result.allowed) {
        dispatch(
          setLineSellingPrices({
            cartLineId: lineId,
            unitPriceIncVat: roundedInc,
            unitPriceExVat: exVat,
          })
        );
        setOverrideUi("allowed");
        setOverrideHint(result.message?.trim() || "Allowed");
      } else {
        setPriceInput(Number(item.unitPriceIncVat ?? 0).toFixed(2));
        setOverrideUi("blocked");
        setOverrideHint(result.message?.trim() || "Below cost!");
      }
    } catch (e) {
      const msg = typeof e === "string" ? e : "Below cost!";
      setPriceInput(Number(item.unitPriceIncVat ?? 0).toFixed(2));
      setOverrideUi("blocked");
      setOverrideHint(msg);
    }
  };

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm shadow-sm sm:p-3">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900 sm:text-base">
          {item.name}
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => lineId && dispatch(removeFromCart(lineId))}
          aria-label="Remove line"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-end">
        <div className="col-span-1 sm:col-span-3">
          <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Price (inc VAT)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value);
              setOverrideUi("idle");
              setOverrideHint("");
            }}
            onBlur={() => void validateAndApplyPrice()}
            className="h-9 w-full min-w-0 rounded-md border border-slate-200 px-2 text-right text-sm font-semibold tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="col-span-1 sm:col-span-4">
          <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Qty
          </label>
          <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-600 hover:bg-white active:bg-slate-100"
              onClick={() => {
                if (!lineId) return;
                if (item.quantity <= 1) dispatch(removeFromCart(lineId));
                else
                  dispatch(updateQuantity({ cartLineId: lineId, quantity: item.quantity - 1 }));
              }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] flex-1 text-center text-sm font-bold tabular-nums sm:text-base">
              {item.quantity}
            </span>
            <button
              type="button"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center hover:bg-white active:bg-slate-100",
                isAtQtyLimit ? "cursor-not-allowed text-rose-400" : "text-slate-600"
              )}
              disabled={isAtQtyLimit}
              onClick={() => {
                if (!lineId) return;
                dispatch(updateQuantity({ cartLineId: lineId, quantity: item.quantity + 1 }));
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="col-span-2 text-right sm:col-span-5 sm:text-right">
          <p className="text-[10px] font-semibold text-slate-500">Line total</p>
          <p className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">
            {formatCurrency(lineGrossAfterLineDiscount(item))}
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <select
          value={lineDiscountType}
          onChange={(e) => {
            if (!lineId) return;
            dispatch(
              updateItemDiscount({
                cartLineId: lineId,
                discountType: e.target.value === "percentage" ? "percentage" : "fixed",
                discountValue: item.discountValue ?? 0,
              })
            );
          }}
          className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:px-2 sm:text-sm"
        >
          <option value="fixed">Line Disc (Amt)</option>
          <option value="percentage">Line Disc (%)</option>
        </select>
        <input
          type="number"
          min={0}
          step="0.01"
          value={item.discountValue || ""}
          onChange={(e) => {
            if (!lineId) return;
            dispatch(
              updateItemDiscount({
                cartLineId: lineId,
                discountType: lineDiscountType,
                discountValue: Number(e.target.value) || 0,
              })
            );
          }}
          placeholder={lineDiscountType === "percentage" ? "0 - 100" : "0.00"}
          className="h-9 rounded-md border border-slate-200 px-2 text-right text-xs font-semibold tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {showBatchPicker && (
        <div className="mt-2 rounded-md border border-amber-100 bg-amber-50/80 px-2 py-1.5 sm:px-2.5 sm:py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 sm:text-sm">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            {batchCount} batches
          </p>
          <label className="mt-1 block text-[10px] font-bold text-amber-900/80">Change batch</label>
          <select
            value={item.purchaseDetailId}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (lineId) dispatch(switchLineBatch({ cartLineId: lineId, purchaseDetailId: id }));
            }}
            className="mt-0.5 w-full max-w-full rounded-md border border-amber-200/80 bg-white py-1.5 pl-2 pr-6 text-xs font-medium text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200 sm:text-sm"
          >
            {batches
              .filter((b) => (b.remainingQuantity ?? 0) > 0)
              .map((b) => (
                <option key={b.purchaseDetailId} value={b.purchaseDetailId}>
                  {batchSelectLabel(b, item.purchaseDetailId)}
                </option>
              ))}
          </select>
        </div>
      )}

      {overrideUi === "checking" && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Validating price…
        </p>
      )}
      {overrideUi === "allowed" && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {overrideHint || "Allowed"}
        </p>
      )}
      {overrideUi === "blocked" && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
          <X className="h-3.5 w-3.5" />
          {overrideHint || "Below cost!"}
        </p>
      )}

      <p className="mt-1 text-[10px] text-slate-400">
        {item.productCode} · Max {item.maxQuantity} {item.unitOfMeasurement}
      </p>
      {isAtQtyLimit && (
        <p className="mt-1 text-[10px] font-semibold leading-snug text-rose-600 sm:text-xs">
          Max qty for this batch — scan again for the next batch.
        </p>
      )}
    </li>
  );
}
