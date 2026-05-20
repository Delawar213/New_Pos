// ============================================
// Cart Slice - POS Cart (batch-aware, VAT-inclusive pricing)
// ============================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import type { SaleScanBatch } from "@/types/sale";

/** Stable React / row id (unchanged when switching batch). Optional on rehydrated legacy state until sanitized. */
export interface CartItem {
  cartLineId?: string;
  /** productId-purchaseDetailId — used to merge duplicate batch lines on scan */
  lineKey: string;
  productId: number;
  purchaseDetailId: number;
  productCode: string;
  name: string;
  sku: string;
  barcode: string;
  unitOfMeasurement: string;
  batchNumber: string;
  expiryDate: string | null;
  /** Unit selling price including VAT */
  unitPriceIncVat: number;
  /** Unit selling price excluding VAT */
  unitPriceExVat: number;
  vatRate: number;
  isVatExempt: boolean;
  quantity: number;
  maxQuantity: number;
  discountType?: "percentage" | "fixed";
  discountValue: number;
  hasMultipleBatches?: boolean;
  /** Missing on older persisted carts; POS sanitizes on load. */
  availableBatches?: SaleScanBatch[];
  /** Product total on hand from last scan (may be lower than a single batch row). */
  qtyInStock?: number;
}

/** Tolerance for decimal qty vs batch remaining stock. */
const STOCK_QTY_EPS = 0.0001;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Authoritative sellable qty for this cart line (batch + product total). */
export function getLineStockCap(item: CartItem): number {
  const batches = item.availableBatches ?? [];
  const batch = batches.find((b) => b.purchaseDetailId === item.purchaseDetailId);
  const fromBatch = batch != null ? Number(batch.remainingQuantity) : NaN;
  const fromLine = Number(item.maxQuantity);
  const fromProduct = Number(item.qtyInStock);

  let cap = 0;
  if (Number.isFinite(fromBatch) && fromBatch > 0) {
    cap = fromBatch;
  } else if (Number.isFinite(fromLine) && fromLine > 0) {
    cap = fromLine;
  }

  if (Number.isFinite(fromProduct) && fromProduct > 0) {
    cap = cap > 0 ? Math.min(cap, fromProduct) : fromProduct;
  }

  return Math.max(0, round2(cap));
}

export type CartStockValidation =
  | { ok: true }
  | { ok: false; title: string; message: string };

/** Block checkout when any line exceeds batch `maxQuantity` or has no stock. */
export function validateCartStockForSale(items: CartItem[]): CartStockValidation {
  for (const item of items) {
    const cap = getLineStockCap(item);
    const qty = item.quantity ?? 0;
    if (cap <= STOCK_QTY_EPS) {
      return {
        ok: false,
        title: "Out of stock",
        message: `${item.name} has no stock available for this batch.`,
      };
    }
    if (qty > cap + STOCK_QTY_EPS) {
      const capLabel = Number.isInteger(cap) ? String(cap) : cap.toFixed(2);
      const qtyLabel = Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
      return {
        ok: false,
        title: "Quantity exceeds stock",
        message: `${item.name}: ${qtyLabel} requested but only ${capLabel} available.`,
      };
    }
    if (qty <= STOCK_QTY_EPS) {
      return {
        ok: false,
        title: "Invalid quantity",
        message: `${item.name}: quantity must be greater than zero.`,
      };
    }
  }
  return { ok: true };
}

interface CartState {
  items: CartItem[];
  /** Walk-in / retail customer — backend expects `1` for default POS cash sales. */
  customerId: number;
  customerName: string;
  paymentMethod: string;
  /** Bank / transfer: receiving account for `payment.bankAccountId`. */
  posBankAccountId: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  paidAmount: number;
  note: string;
}

const initialState: CartState = {
  items: [],
  customerId: 1,
  customerName: "Walking customer",
  paymentMethod: "walking",
  posBankAccountId: 1,
  discountType: "fixed",
  discountValue: 0,
  paidAmount: 0,
  note: "",
};

export function lineGrossIncVat(item: CartItem): number {
  return Number(item.unitPriceIncVat ?? 0) * item.quantity;
}

/** Line total including VAT after line-level discount. */
export function lineGrossAfterLineDiscount(item: CartItem): number {
  const gross = lineGrossIncVat(item);
  if (item.discountType === "percentage") {
    return gross * (1 - Math.min(100, Math.max(0, item.discountValue)) / 100);
  }
  return Math.max(0, gross - item.discountValue);
}

export function lineNetExVatAndVat(item: CartItem): { netExVat: number; vat: number } {
  const after = lineGrossAfterLineDiscount(item);
  if (item.isVatExempt || item.vatRate <= 0) {
    return { netExVat: after, vat: 0 };
  }
  const netExVat = after / (1 + item.vatRate / 100);
  const vat = after - netExVat;
  return { netExVat, vat };
}

export function lineDiscountAmountForApi(item: CartItem): number {
  const gross = lineGrossIncVat(item);
  if (item.discountType === "percentage") {
    return Math.round(gross * (Math.min(100, Math.max(0, item.discountValue)) / 100) * 100) / 100;
  }
  return Math.min(item.discountValue, gross);
}

interface CartStateLike {
  cart: CartState;
}

export const selectCartItems = (state: CartStateLike) => state.cart.items;
export const selectCartItemCount = (state: CartStateLike) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

/** Sum of line totals (inc VAT, after line discounts). */
export const selectCartGrossAfterLineDiscounts = (state: CartStateLike) =>
  state.cart.items.reduce((sum, item) => sum + lineGrossAfterLineDiscount(item), 0);

export const selectCartNetExVatTotal = (state: CartStateLike) =>
  state.cart.items.reduce((sum, item) => sum + lineNetExVatAndVat(item).netExVat, 0);

export const selectCartVatTotal = (state: CartStateLike) =>
  state.cart.items.reduce((sum, item) => sum + lineNetExVatAndVat(item).vat, 0);

/** Cart-level discount applied to gross (inc VAT) total after line discounts. */
export const selectCartTotal = (state: CartStateLike) => {
  const gross = selectCartGrossAfterLineDiscounts(state);
  let cartDisc = 0;
  if (state.cart.discountType === "percentage") {
    cartDisc = gross * (Math.min(100, Math.max(0, state.cart.discountValue)) / 100);
  } else {
    cartDisc = Math.min(state.cart.discountValue, gross);
  }
  return Math.max(0, gross - cartDisc);
};

/** Amount before cart-level discount (for showing cart discount row). */
export const selectCartGrossBeforeCartDiscount = (state: CartStateLike) =>
  selectCartGrossAfterLineDiscounts(state);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * POS: same barcode / same batch → increase qty. Refreshes `maxQuantity` from latest scan.
     */
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const p = action.payload;
      const addQty = p.quantity > 0 ? p.quantity : 1;

      const normBc = (b: string | undefined) => String(b ?? "").trim();
      const sameLine = (item: CartItem) =>
        item.lineKey === p.lineKey ||
        (item.productId === p.productId &&
          normBc(item.barcode) === normBc(p.barcode) &&
          item.purchaseDetailId === p.purchaseDetailId);

      const existingIndex = state.items.findIndex(sameLine);

      if (existingIndex >= 0) {
        const cur = state.items[existingIndex];
        const cap = getLineStockCap(p);
        cur.maxQuantity = cap;
        if (p.qtyInStock != null) cur.qtyInStock = p.qtyInStock;
        if (p.availableBatches?.length) {
          cur.availableBatches = p.availableBatches;
        }
        if (p.hasMultipleBatches != null) {
          cur.hasMultipleBatches = p.hasMultipleBatches;
        }
        cur.batchNumber = p.batchNumber;
        cur.expiryDate = p.expiryDate ?? cur.expiryDate;
        const next = cur.quantity + addQty;
        cur.quantity = Math.min(next, cap);
        return;
      }

      const cap = getLineStockCap(p);
      const q = Math.min(addQty, cap);
      if (q > 0) {
        state.items.push({ ...p, quantity: q, maxQuantity: cap });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.cartLineId !== action.payload);
    },

    updateQuantity: (state, action: PayloadAction<{ cartLineId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.cartLineId === action.payload.cartLineId);
      if (!item) return;
      const cap = getLineStockCap(item);
      item.maxQuantity = cap;
      const q = action.payload.quantity;
      if (!Number.isFinite(q) || q <= STOCK_QTY_EPS) return;
      item.quantity = round2(Math.min(q, cap));
    },

    /** Sync caps from batch list and clamp qty — run before checkout. */
    syncCartStockCaps: (state) => {
      state.items.forEach((item) => {
        const cap = getLineStockCap(item);
        item.maxQuantity = cap;
        if (item.quantity > cap + STOCK_QTY_EPS) {
          item.quantity = cap;
        }
      });
    },

    /**
     * Fix persisted / legacy lines missing cartLineId, availableBatches, or prices.
     * Call when opening POS.
     */
    sanitizeCartLinesForPos: (state) => {
      if (typeof state.customerId !== "number" || state.customerId < 1) {
        state.customerId = 1;
        state.customerName = "Walking customer";
      }
      const pm = String(state.paymentMethod ?? "").toLowerCase();
      state.paymentMethod = pm === "credit" ? "credit" : "walking";
      if (typeof state.posBankAccountId !== "number" || state.posBankAccountId < 1) {
        state.posBankAccountId = 1;
      }
      state.items.forEach((raw, index) => {
        const item = raw as CartItem & { price?: number };
        item.barcode = String(item.barcode ?? "").trim();
        const prodId = item.productId ?? 0;
        const pdId = item.purchaseDetailId ?? index;
        if (!item.lineKey) {
          item.lineKey = `${prodId}-${pdId}`;
        }
        if (!item.cartLineId) {
          item.cartLineId = `pos-${item.lineKey}-${index}`;
        }
        if (item.unitPriceIncVat == null && item.price != null) {
          item.unitPriceIncVat = item.price;
        }
        if (item.unitPriceIncVat == null) {
          item.unitPriceIncVat = 0;
        }
        if (item.unitPriceExVat == null) {
          item.unitPriceExVat =
            item.isVatExempt || !item.vatRate
              ? item.unitPriceIncVat
              : Math.round((item.unitPriceIncVat / (1 + item.vatRate / 100)) * 100) / 100;
        }
        if (!Array.isArray(item.availableBatches)) {
          item.availableBatches = [
            {
              purchaseDetailId: pdId,
              batchNumber: item.batchNumber ?? "—",
              expiryDate: item.expiryDate ?? null,
              sellingPrice: item.unitPriceIncVat,
              sellingPriceExVat: item.unitPriceExVat,
              remainingQuantity: item.maxQuantity ?? 0,
              purchaseDate: null,
            },
          ];
        }
        const inStock = item.availableBatches.filter((b) => (b.remainingQuantity ?? 0) > 0);
        if (item.hasMultipleBatches == null) {
          item.hasMultipleBatches = inStock.length > 1;
        }
        const cap = getLineStockCap(item);
        item.maxQuantity = cap;
        if (cap > 0 && item.quantity > cap + STOCK_QTY_EPS) {
          item.quantity = round2(cap);
        }
      });
    },

    switchLineBatch: (
      state,
      action: PayloadAction<{ cartLineId: string; purchaseDetailId: number }>
    ) => {
      const item = state.items.find((i) => i.cartLineId === action.payload.cartLineId);
      if (!item) return;
      const batches = item.availableBatches ?? [];
      const batch = batches.find((b) => b.purchaseDetailId === action.payload.purchaseDetailId);
      if (!batch || batch.remainingQuantity <= 0) return;
      const newKey = `${item.productId}-${batch.purchaseDetailId}`;
      const conflict = state.items.some(
        (i) => i.lineKey === newKey && i.cartLineId !== item.cartLineId
      );
      if (conflict) return;
      item.lineKey = newKey;
      item.purchaseDetailId = batch.purchaseDetailId;
      item.batchNumber = batch.batchNumber;
      item.expiryDate = batch.expiryDate ?? null;
      item.maxQuantity = Math.max(0, Number(batch.remainingQuantity) || 0);
      item.unitPriceIncVat = batch.sellingPrice;
      item.unitPriceExVat = batch.sellingPriceExVat;
      const cap = getLineStockCap(item);
      item.maxQuantity = cap;
      if (item.quantity > cap) item.quantity = round2(cap);
    },

    setLineSellingPrices: (
      state,
      action: PayloadAction<{
        cartLineId: string;
        unitPriceIncVat: number;
        unitPriceExVat: number;
      }>
    ) => {
      const item = state.items.find((i) => i.cartLineId === action.payload.cartLineId);
      if (!item) return;
      item.unitPriceIncVat =
        Math.round(Math.max(0, action.payload.unitPriceIncVat) * 100) / 100;
      item.unitPriceExVat =
        Math.round(Math.max(0, action.payload.unitPriceExVat) * 100) / 100;
    },

    updateItemDiscount: (
      state,
      action: PayloadAction<{
        cartLineId: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
      }>
    ) => {
      const item = state.items.find((i) => i.cartLineId === action.payload.cartLineId);
      if (item) {
        item.discountType = action.payload.discountType;
        item.discountValue = action.payload.discountValue;
      }
    },

    setCustomer: (state, action: PayloadAction<{ id: number; name: string }>) => {
      state.customerId = action.payload.id;
      state.customerName = action.payload.name;
    },

    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },

    setPosBankAccountId: (state, action: PayloadAction<number>) => {
      state.posBankAccountId = Math.max(0, action.payload);
    },

    setCartDiscount: (
      state,
      action: PayloadAction<{ type: "percentage" | "fixed"; value: number }>
    ) => {
      state.discountType = action.payload.type;
      state.discountValue = action.payload.value;
    },

    setPaidAmount: (state, action: PayloadAction<number>) => {
      state.paidAmount = action.payload;
    },

    setNote: (state, action: PayloadAction<string>) => {
      state.note = action.payload;
    },

    clearCart: () => initialState,
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  sanitizeCartLinesForPos,
  syncCartStockCaps,
  switchLineBatch,
  setLineSellingPrices,
  updateItemDiscount,
  setCustomer,
  setPaymentMethod,
  setPosBankAccountId,
  setCartDiscount,
  setPaidAmount,
  setNote,
  clearCart,
} = cartSlice.actions;

export const cartSliceConfig = configureSlice(cartSlice, true);

export default cartSlice.reducer;
