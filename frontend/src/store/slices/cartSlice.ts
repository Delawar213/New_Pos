// ============================================
// Cart Slice - POS Cart State Management
// ============================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  taxPercentage: number;
  discountType?: "percentage" | "fixed";
  discountValue: number;
  maxQuantity: number; // Available stock
}

interface CartState {
  items: CartItem[];
  customerId: number | null;
  customerName: string;
  paymentMethod: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  paidAmount: number;
  note: string;
}

const initialState: CartState = {
  items: [],
  customerId: null,
  customerName: "Walk-in Customer",
  paymentMethod: "cash",
  discountType: "fixed",
  discountValue: 0,
  paidAmount: 0,
  note: "",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingIndex >= 0) {
        const newQty = state.items[existingIndex].quantity + 1;
        if (newQty <= state.items[existingIndex].maxQuantity) {
          state.items[existingIndex].quantity = newQty;
        }
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: number; quantity: number }>
    ) => {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId
      );
      if (item && action.payload.quantity <= item.maxQuantity && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      }
    },

    updateItemDiscount: (
      state,
      action: PayloadAction<{
        productId: number;
        discountType: "percentage" | "fixed";
        discountValue: number;
      }>
    ) => {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId
      );
      if (item) {
        item.discountType = action.payload.discountType;
        item.discountValue = action.payload.discountValue;
      }
    },

    setCustomer: (
      state,
      action: PayloadAction<{ id: number | null; name: string }>
    ) => {
      state.customerId = action.payload.id;
      state.customerName = action.payload.name;
    },

    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
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

// ---- Selectors ----
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => {
    let itemPrice = item.price * item.quantity;
    if (item.discountType === "percentage") {
      itemPrice -= itemPrice * (item.discountValue / 100);
    } else {
      itemPrice -= item.discountValue;
    }
    return sum + itemPrice;
  }, 0);

export const selectCartTax = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => {
    let itemPrice = item.price * item.quantity;
    if (item.discountType === "percentage") {
      itemPrice -= itemPrice * (item.discountValue / 100);
    } else {
      itemPrice -= item.discountValue;
    }
    return sum + itemPrice * (item.taxPercentage / 100);
  }, 0);

export const selectCartTotal = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  const tax = selectCartTax(state);
  let discount = 0;
  if (state.cart.discountType === "percentage") {
    discount = subtotal * (state.cart.discountValue / 100);
  } else {
    discount = state.cart.discountValue;
  }
  return subtotal + tax - discount;
};

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateItemDiscount,
  setCustomer,
  setPaymentMethod,
  setCartDiscount,
  setPaidAmount,
  setNote,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
