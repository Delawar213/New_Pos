"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Barcode,
  Minus,
  Plus,
  Trash2,
  Loader2,
  Receipt,
  Banknote,
  Wallet,
  AlertTriangle,
  Check,
  X,
  Undo2,
  History,
  ShoppingBag,
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
  validateCartStockForSale,
  getLineStockCap,
  syncCartStockCaps,
} from "@/store/slices/cart/cart.slice";
import { createSale, scanPosBarcode, validatePosPriceOverride } from "@/store/slices/sale/sale.slice";
import { buildPosReceiptSnapshot } from "@/lib/posReceipt";
import type { PosReceiptSnapshot } from "@/lib/posReceipt";
import { PosSaleReceiptDialog } from "@/components/pos/PosSaleReceiptDialog";
import {
  customerBulkPayment,
  fetchCustomersDropdown,
} from "@/store/slices/customer/customer.slice";
import { DecimalInput, SearchableSelect } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
// import { BarcodeCameraScanner } from "@/components/pos/BarcodeCameraScanner";

/** Default retail / walk-in customer id expected by the sales API. */
const WALK_IN_CUSTOMER_ID = 1;
/** Till / cash ledger — default “receive into” account for POS. */
const CASH_DEPOSIT_ACCOUNT_ID = 1;

const PAYMENT_OPTIONS = [
  { value: "walking", label: "Walking customer", icon: Banknote },
  { value: "credit", label: "Credit", icon: Wallet },
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Minimum sale quantity (decimals allowed, e.g. 0.5, 1.25). */
const POS_MIN_QTY = 0.01;
const POS_QTY_STEP = 1;

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
    const accountCredit = round2(Math.max(0, tender - grandTotal));
    if (paidForApi > 0 && onAccount > 0) {
      description = [description, `Part paid now ${paidForApi}; on account ${onAccount}`].join(
        " · "
      );
    } else if (onAccount > 0 && paidForApi <= 0) {
      description = [description, `On account ${onAccount}`].join(" · ");
    }
    if (accountCredit > 0) {
      description = [description, `Account credit ${accountCredit}`].join(" · ");
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
        paidForApi > 0
          ? Math.max(CASH_DEPOSIT_ACCOUNT_ID, cart.posBankAccountId || CASH_DEPOSIT_ACCOUNT_ID)
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
  const refocusBarcodeAfterScanRef = useRef(false);
  const walkingPaidTouchedRef = useRef(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [receiptSnapshot, setReceiptSnapshot] = useState<PosReceiptSnapshot | null>(null);

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
    barcodeRef.current?.focus({ preventScroll: true });
  }, []);

  /** After scan, `disabled={scanning}` drops focus; refocus once input is enabled again. */
  useLayoutEffect(() => {
    if (scanning || !refocusBarcodeAfterScanRef.current) return;
    refocusBarcodeAfterScanRef.current = false;
    barcodeRef.current?.focus({ preventScroll: true });
  }, [scanning]);

  /** Walking customer: keep Paid in sync with total unless cashier entered a different tender (e.g. overpay for change). */
  useEffect(() => {
    if (paymentMethod !== "walking") return;
    if (walkingPaidTouchedRef.current) return;
    dispatch(setPaidAmount(round2(grandTotal)));
  }, [paymentMethod, grandTotal, dispatch]);

  useLayoutEffect(() => {
    dispatch(sanitizeCartLinesForPos());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchBankAccountsDropdown());
  }, [dispatch]);

  const applyPaymentMethod = useCallback(
    (value: string) => {
      dispatch(setPaymentMethod(value));
      void dispatch(fetchBankAccountsDropdown());
      dispatch(setPosBankAccountId(CASH_DEPOSIT_ACCOUNT_ID));
      if (value === "credit") {
        walkingPaidTouchedRef.current = false;
        dispatch(setPaidAmount(0));
        void dispatch(fetchCustomersDropdown());
        return;
      }
      if (value === "walking") {
        walkingPaidTouchedRef.current = false;
        dispatch(setCustomer({ id: WALK_IN_CUSTOMER_ID, name: "Walking customer" }));
        const gt = round2(selectCartTotal(store.getState()));
        dispatch(setPaidAmount(gt));
      }
    },
    [dispatch]
  );

  const depositSelectValue =
    posBankAccountId >= CASH_DEPOSIT_ACCOUNT_ID ? posBankAccountId : CASH_DEPOSIT_ACCOUNT_ID;
  const bankAccountsExcludingCash = useMemo(
    () =>
      bankDropdownAccounts.filter((a) => a.bankAccountId !== CASH_DEPOSIT_ACCOUNT_ID),
    [bankDropdownAccounts]
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
        refocusBarcodeAfterScanRef.current = true;
        setScanning(false);
        setBarcodeInput("");
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
  const accountCreditAmount =
    paymentMethod === "credit" && tender > grandTotal ? round2(tender - grandTotal) : 0;
  const changeDue =
    paymentMethod !== "credit" && tender > grandTotal ? round2(tender - grandTotal) : 0;
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
    const tenderCheck = round2(Math.max(0, paidAmount));
    let paidForApiCheck = tenderCheck;
    if (paymentMethod === "credit") {
      paidForApiCheck = round2(Math.min(tenderCheck, grandTotal));
    }
    if (paidForApiCheck > 0 && posBankAccountId < CASH_DEPOSIT_ACCOUNT_ID) {
      dispatch(
        addToast({
          type: "warning",
          title: "Receive-into account required",
          message: "Choose Cash or a bank account for the amount paid now.",
        })
      );
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur?.();

    const overStockBefore = items.some(
      (i) => (i.quantity ?? 0) > getLineStockCap(i) + 0.0001
    );
    dispatch(syncCartStockCaps());
    const freshItems = store.getState().cart.items;
    const stockCheck = validateCartStockForSale(freshItems);
    if (!stockCheck.ok || overStockBefore) {
      dispatch(
        addToast({
          type: "error",
          title: stockCheck.ok ? "Quantity exceeds stock" : stockCheck.title,
          message: stockCheck.ok
            ? "One or more lines exceed available stock. Quantity was reduced to the maximum allowed."
            : stockCheck.message,
          duration: 6000,
        })
      );
      return;
    }
    const payload = buildCreateSaleRequest(store.getState().cart);
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
    const tenderForReceipt = round2(Math.max(0, paidAmount));
    let paidTowardInvoice = tenderForReceipt;
    if (paymentMethod === "credit") {
      paidTowardInvoice = round2(Math.min(tenderForReceipt, grandTotal));
    }
    let accountCreditPosted = 0;
    if (paymentMethod === "credit" && accountCreditAmount > 0 && customerId !== WALK_IN_CUSTOMER_ID) {
      const invoiceNo =
        typeof result.payload?.data === "object" &&
        result.payload.data &&
        "invoiceNumber" in (result.payload.data as object)
          ? String((result.payload.data as { invoiceNumber?: string }).invoiceNumber ?? "")
          : "";
      const bulkResult = await dispatch(
        customerBulkPayment({
          customerId,
          paymentAmount: accountCreditAmount,
          bankAccountId:
            posBankAccountId >= CASH_DEPOSIT_ACCOUNT_ID
              ? posBankAccountId
              : CASH_DEPOSIT_ACCOUNT_ID,
          paymentDate: new Date().toISOString(),
          description: `POS account payment${invoiceNo ? ` · ${invoiceNo}` : ""}`,
        })
      );
      if (customerBulkPayment.rejected.match(bulkResult)) {
        dispatch(
          addToast({
            type: "warning",
            title: "Sale saved — account credit failed",
            message:
              bulkResult.payload ||
              "Invoice was saved but the extra amount was not posted to the customer account.",
            duration: 7000,
          })
        );
      } else {
        accountCreditPosted = accountCreditAmount;
        void dispatch(fetchCustomersDropdown());
      }
    }
    const snapshot = buildPosReceiptSnapshot({
      cart: store.getState().cart,
      items: [...items],
      bankDropdownAccounts,
      cashDepositAccountId: CASH_DEPOSIT_ACCOUNT_ID,
      grandTotal,
      paidAmount: paidTowardInvoice,
      onAccountAmount,
      changeDue,
      accountCreditAmount: accountCreditPosted,
      netExVat,
      vatTotal,
      saleDiscountAmount,
      apiData: result.payload?.data,
    });
    dispatch(addToast({ type: "success", title: "Sale saved", message: msg, duration: 2800 }));
    walkingPaidTouchedRef.current = false;
    dispatch(clearCart());
    setReceiptSnapshot(snapshot);
    setBarcodeInput("");
    queueMicrotask(() => barcodeRef.current?.focus({ preventScroll: true }));
  };

  return (
    <>
      {/*
      <BarcodeCameraScanner
        open={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onDetected={(code) => {
          setCameraScannerOpen(false);
          void submitScanWithCode(code);
        }}
      />
      */}
      <PosSaleReceiptDialog
        open={receiptSnapshot != null}
        receipt={receiptSnapshot}
        onDismiss={() => {
          setReceiptSnapshot(null);
          queueMicrotask(() => barcodeRef.current?.focus({ preventScroll: true }));
        }}
      />
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50/30 to-slate-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-indigo-200/50 bg-white/95 px-2 py-1.5 shadow-sm sm:px-3">
        <p className="text-xs font-bold text-slate-700 sm:text-sm">POS Terminal</p>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Link
            href="/sales/return"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Return
          </Link>
          <Link
            href="/sales"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            History
          </Link>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-white shadow-md">
            <ShoppingBag className="h-3.5 w-3.5 text-indigo-300" />
            <span className="text-xs font-black tabular-nums">{formatCurrency(grandTotal)}</span>
            <span className="text-[10px] text-slate-400">({itemCount})</span>
          </div>
        </div>
        <div className="sr-only" aria-hidden>
          {paymentMethod === "credit" ? (
            <CreditCustomerSummary
              walkInId={WALK_IN_CUSTOMER_ID}
              options={dropdownCustomers}
              customerId={customerId}
              customerName={customerName}
            />
          ) : (
            <span>Walking customer ID {WALK_IN_CUSTOMER_ID}</span>
          )}
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_min(20rem,38vw)] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-slate-200/80 bg-white/90 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-white px-2 py-2 sm:px-3">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
                <input
                  ref={barcodeRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Scan barcode — Enter to add"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void submitScan();
                    }
                  }}
                  disabled={scanning}
                  className="h-10 w-full rounded-xl border-2 border-indigo-100 bg-white py-2 pl-10 pr-3 font-mono text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                type="button"
                disabled={scanning || !barcodeInput.trim()}
                onClick={() => void submitScan()}
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-bold text-white shadow-md hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40"
              >
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-2 py-1.5 sm:px-3">
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500">
                  <Barcode className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Ready to scan</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Scan or type a barcode and press Enter
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <LineRow
                    key={item.cartLineId ?? `${item.lineKey ?? "line"}-${index}`}
                    item={item}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl">
          <div className="shrink-0 border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
              Total due
            </p>
            <p className="text-2xl font-black tabular-nums sm:text-4xl">
              {formatCurrency(grandTotal)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Net {formatCurrency(netExVat)} · VAT {formatCurrency(vatTotal)}
              {saleDiscountAmount > 0 ? ` · Disc −${formatCurrency(saleDiscountAmount)}` : ""}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2 scrollbar-thin">
            <div className="rounded-xl bg-white/10 p-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase text-indigo-200">Sale discount</p>
            <div className="grid grid-cols-2 gap-1.5">
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
                className="h-8 min-w-0 rounded-lg border-0 bg-white/15 px-2 text-xs font-medium text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="fixed" className="text-slate-900">Amount</option>
                <option value="percentage" className="text-slate-900">%</option>
              </select>
              <DecimalInput
                value={saleDiscountValue}
                onChange={(value) =>
                  dispatch(
                    setCartDiscount({
                      type: saleDiscountType,
                      value:
                        saleDiscountType === "percentage"
                          ? Math.min(100, Math.max(0, value))
                          : Math.max(0, value),
                    })
                  )
                }
                integer={saleDiscountType === "percentage"}
                emptyWhenZero
                placeholder={saleDiscountType === "percentage" ? "0" : "0.00"}
                className="h-9 rounded-md border-slate-200 px-2 text-right text-xs font-semibold sm:text-sm"
              />
            </div>
            </div>

            <div className="rounded-xl bg-white/10 p-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase text-indigo-200">Payment</p>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyPaymentMethod(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[11px] font-bold transition",
                    paymentMethod === value
                      ? "border-emerald-400 bg-emerald-500/30 text-white"
                      : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {label}
                </button>
              ))}
            </div>
            {paymentMethod === "credit" ? (
              <CreditCustomerPicker
                walkInId={WALK_IN_CUSTOMER_ID}
                options={dropdownCustomers}
                customerId={customerId}
                onPick={(c) =>
                  dispatch(setCustomer({ id: c.customerId, name: c.customerName }))
                }
              />
            ) : null}
            <div className="mt-2">
              <label className="mb-1 block text-[10px] font-semibold text-indigo-200">
                Payment received into
              </label>
              <select
                value={depositSelectValue}
                onChange={(e) =>
                  dispatch(
                    setPosBankAccountId(
                      Number(e.target.value) || CASH_DEPOSIT_ACCOUNT_ID
                    )
                  )
                }
                className="h-8 w-full max-w-full rounded-lg border-0 bg-white/15 px-2 text-xs font-medium text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value={CASH_DEPOSIT_ACCOUNT_ID}>Cash</option>
                {bankAccountsExcludingCash.map((a) => (
                  <option key={a.bankAccountId} value={a.bankAccountId}>
                    {a.accountName} ({a.accountType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-2">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
              <label className="text-[10px] font-bold uppercase text-indigo-200">
                {paymentMethod === "credit" ? "Paid now" : "Paid"}
              </label>
              {paymentMethod === "credit" && grandTotal > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch(setPaidAmount(grandTotal))}
                  className="text-[10px] font-semibold text-indigo-300 hover:text-white"
                >
                  Pay full
                </button>
              )}
            </div>
            <DecimalInput
              value={paidAmount}
              onChange={(n) => {
                if (paymentMethod === "walking") {
                  const g = round2(grandTotal);
                  walkingPaidTouchedRef.current = Math.abs(round2(n) - g) > 0.01;
                }
                dispatch(setPaidAmount(Math.max(0, n)));
              }}
              emptyWhenZero={paymentMethod === "credit"}
              placeholder="0.00"
              className="h-9 rounded-lg border-0 bg-white/15 px-2 text-right text-base font-bold text-white"
            />
            <label className="mb-0.5 mt-1.5 block text-[10px] font-bold uppercase text-indigo-200">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => dispatch(setNote(e.target.value))}
              placeholder="Optional"
              className="h-8 w-full rounded-lg border-0 bg-white/15 px-2 text-xs text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-white/10 bg-slate-950/90 px-3 py-2">
            {(changeDue > 0 || onAccountAmount > 0 || accountCreditAmount > 0 || amountDue > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {changeDue > 0 && (
                  <span className="rounded-lg bg-emerald-500/25 px-2 py-1 text-xs font-bold text-emerald-200">
                    Change {formatCurrency(changeDue)}
                  </span>
                )}
                {onAccountAmount > 0 && (
                  <span className="rounded-lg bg-indigo-500/25 px-2 py-1 text-xs font-bold text-indigo-200">
                    On account {formatCurrency(onAccountAmount)}
                  </span>
                )}
                {accountCreditAmount > 0 && (
                  <span className="rounded-lg bg-blue-500/25 px-2 py-1 text-xs font-bold text-blue-200">
                    Credit {formatCurrency(accountCreditAmount)}
                  </span>
                )}
                {amountDue > 0 && (
                  <span className="rounded-lg bg-amber-500/25 px-2 py-1 text-xs font-bold text-amber-200">
                    Due {formatCurrency(amountDue)}
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={items.length === 0 || actionLoading}
              onClick={() => void handleCompleteSale()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-black text-white shadow-lg transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Complete sale
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}

function CreditCustomerSummary({
  walkInId,
  options,
  customerId,
  customerName,
}: {
  walkInId: number;
  options: CustomerDropdown[];
  customerId: number;
  customerName: string;
}) {
  const row = useMemo(
    () => options.find((c) => c.customerId === customerId),
    [options, customerId]
  );

  if (customerId === walkInId) {
    return (
      <div className="flex h-10 items-center rounded-lg border border-dashed border-amber-300 bg-amber-50/80 px-3 text-xs text-amber-900 sm:text-sm">
        Select credit customer in payment panel →
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2">
      <p className="truncate text-sm font-semibold text-slate-900">{customerName}</p>
      <p className="text-[10px] text-slate-500 sm:text-xs">
        {row?.customerCode ?? `ID ${customerId}`}
        {row?.customerTypeName ? ` · ${row.customerTypeName}` : ""}
      </p>
      {row ? (
        <p className="mt-1 text-xs font-semibold tabular-nums text-slate-800">
          Balance: {formatCurrency(row.currentBalance)}
          {row.creditLimit > 0 ? (
            <span className="ml-2 font-normal text-slate-500">
              Limit {formatCurrency(row.creditLimit)}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function CreditCustomerPicker({
  walkInId,
  options,
  customerId,
  onPick,
}: {
  walkInId: number;
  options: CustomerDropdown[];
  customerId: number;
  onPick: (c: CustomerDropdown) => void;
}) {
  const focusWrapRef = useRef<HTMLDivElement>(null);

  const creditOptions = useMemo(
    () => options.filter((c) => c.customerId !== walkInId),
    [options, walkInId]
  );

  const selectOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      creditOptions.map((c) => ({
        value: c.customerId,
        label: `${c.customerCode} — ${c.customerName}`,
        search: `${c.customerCode} ${c.customerName} ${c.customerTypeName ?? ""}`.toLowerCase(),
      })),
    [creditOptions]
  );

  const selected = creditOptions.find((c) => c.customerId === customerId);

  useEffect(() => {
    const t = window.setTimeout(() => {
      focusWrapRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      ref={focusWrapRef}
      className="mt-2 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50/80 to-white p-2.5 sm:p-3"
    >
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-blue-900 sm:text-xs">
        Credit customer <span className="text-red-600">*</span>
      </label>
      <SearchableSelect
        options={selectOptions}
        value={customerId === walkInId ? 0 : customerId}
        onChange={(id) => {
          const row = creditOptions.find((c) => c.customerId === id);
          if (row) onPick(row);
        }}
        placeholder="Search customer name or code…"
        emptyHint="No customers"
        triggerClassName="border-blue-200 bg-white py-2.5 text-sm"
      />
      {selected ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200/80 bg-white px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{selected.customerName}</p>
            <p className="text-[10px] text-slate-500">{selected.customerTypeName || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase text-slate-500">Current balance</p>
            <p className="text-sm font-bold tabular-nums text-slate-900">
              {formatCurrency(selected.currentBalance)}
            </p>
            {selected.creditLimit > 0 ? (
              <p className="text-[10px] tabular-nums text-slate-500">
                Limit {formatCurrency(selected.creditLimit)}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-amber-800 sm:text-xs">Choose a customer to continue.</p>
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
  const stockCap = getLineStockCap(item);
  const isAtQtyLimit = item.quantity >= stockCap - 0.0001 && stockCap > 0;
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
  const maxQty = stockCap > 0 ? stockCap : POS_MIN_QTY;

  const setLineQty = (raw: number) => {
    if (!lineId) return;
    let n = round2(raw);
    if (!Number.isFinite(n) || n <= 0) n = POS_MIN_QTY;
    const capped = round2(Math.max(POS_MIN_QTY, Math.min(n, maxQty)));
    if (raw > maxQty + 0.0001) {
      dispatch(
        addToast({
          type: "warning",
          title: "Stock limit",
          message: `Max ${maxQty} available for this batch.`,
          duration: 3500,
        })
      );
    }
    dispatch(updateQuantity({ cartLineId: lineId, quantity: capped }));
  };

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
    <li className="px-2 py-2.5 text-sm transition hover:bg-indigo-50/40 sm:px-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900">
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
          <div className="flex h-10 min-w-0 flex-1 items-stretch rounded-md border border-slate-200 bg-slate-50">
            <button
              type="button"
              className="flex h-10 w-9 shrink-0 items-center justify-center text-slate-600 hover:bg-white active:bg-slate-100 sm:w-10"
              onClick={() => {
                if (!lineId) return;
                if (item.quantity <= POS_MIN_QTY + 0.0001) {
                  dispatch(removeFromCart(lineId));
                } else {
                  dispatch(
                    updateQuantity({
                      cartLineId: lineId,
                      quantity: round2(Math.max(POS_MIN_QTY, item.quantity - POS_QTY_STEP)),
                    })
                  );
                }
              }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <DecimalInput
              min={POS_MIN_QTY}
              max={maxQty}
              emptyWhenZero={false}
              value={item.quantity}
              onChange={setLineQty}
              placeholder="0"
              className="min-w-0 flex-1 rounded-none border-0 border-x border-slate-200 bg-white py-0 text-center text-sm font-bold shadow-none focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-base"
            />
            <button
              type="button"
              className={cn(
                "flex h-10 w-9 shrink-0 items-center justify-center hover:bg-white active:bg-slate-100 sm:w-10",
                isAtQtyLimit ? "cursor-not-allowed text-rose-400" : "text-slate-600"
              )}
              disabled={isAtQtyLimit}
              onClick={() => {
                if (!lineId) return;
                dispatch(
                  updateQuantity({
                    cartLineId: lineId,
                    quantity: round2(Math.min(maxQty, item.quantity + POS_QTY_STEP)),
                  })
                );
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
        <DecimalInput
          value={item.discountValue ?? 0}
          onChange={(discountValue) => {
            if (!lineId) return;
            dispatch(
              updateItemDiscount({
                cartLineId: lineId,
                discountType: lineDiscountType,
                discountValue:
                  lineDiscountType === "percentage"
                    ? Math.min(100, Math.max(0, discountValue))
                    : Math.max(0, discountValue),
              })
            );
          }}
          integer={lineDiscountType === "percentage"}
          emptyWhenZero
          placeholder={lineDiscountType === "percentage" ? "0" : "0.00"}
          className="h-9 rounded-md border-slate-200 px-2 text-right text-xs font-semibold sm:text-sm"
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
        {item.productCode} · Max {stockCap} {item.unitOfMeasurement}
      </p>
      {isAtQtyLimit && (
        <p className="mt-1 text-[10px] font-semibold leading-snug text-rose-600 sm:text-xs">
          Max qty for this batch — scan again for the next batch.
        </p>
      )}
    </li>
  );
}
