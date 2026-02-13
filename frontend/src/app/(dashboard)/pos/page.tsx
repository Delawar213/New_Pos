"use client";

// ============================================
// POS Terminal Page - Point of Sale Interface
// ============================================

import React, { useState } from "react";
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Building2,
  Printer,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  setCustomer,
  setPaymentMethod,
  setPaidAmount,
  clearCart,
  selectCartItems,
  selectCartSubtotal,
  selectCartTax,
  selectCartTotal,
  selectCartItemCount,
} from "@/store/slices/cartSlice";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/store/slices/cartSlice";

// Demo products for POS - replace with API search
const availableProducts = [
  { productId: 1, name: "Premium Wall Paint - White", sku: "PWP-001", price: 50, taxPercentage: 5, maxQuantity: 120, discountValue: 0 },
  { productId: 2, name: "Wood Finish Varnish", sku: "WFV-002", price: 40, taxPercentage: 5, maxQuantity: 80, discountValue: 0 },
  { productId: 3, name: "Interior Satin Paint", sku: "ISP-003", price: 55, taxPercentage: 5, maxQuantity: 65, discountValue: 0 },
  { productId: 4, name: "Exterior Weather Coat", sku: "EWC-004", price: 60, taxPercentage: 5, maxQuantity: 45, discountValue: 0 },
  { productId: 5, name: "Metal Primer Grey", sku: "MPG-005", price: 35, taxPercentage: 5, maxQuantity: 90, discountValue: 0 },
  { productId: 6, name: "Spray Paint - Red", sku: "SPR-006", price: 15, taxPercentage: 5, maxQuantity: 200, discountValue: 0 },
  { productId: 7, name: "Paint Brush Set", sku: "PBS-007", price: 25, taxPercentage: 5, maxQuantity: 150, discountValue: 0 },
  { productId: 8, name: "Roller Set", sku: "RLS-008", price: 30, taxPercentage: 5, maxQuantity: 100, discountValue: 0 },
];

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank", label: "Bank", icon: Building2 },
];

export default function POSPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const tax = useAppSelector(selectCartTax);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const { customerName, paymentMethod, paidAmount } = useAppSelector((s) => s.cart);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product: typeof availableProducts[0]) => {
    dispatch(addToCart(product as CartItem));
  };

  const change = paidAmount > total ? paidAmount - total : 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-4 overflow-hidden">
      {/* Left: Products */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            <Barcode className="h-5 w-5 text-gray-300" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredProducts.map((product) => (
              <button
                key={product.productId}
                onClick={() => handleAddProduct(product)}
                className="group flex flex-col rounded-lg border border-gray-100 p-3 text-left transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                  {product.name}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">{product.sku}</p>
                <p className="mt-1 text-sm font-bold text-blue-600">
                  {formatCurrency(product.price)}
                </p>
                <p className="text-[10px] text-gray-400">Stock: {product.maxQuantity}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-[380px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Cart header */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Current Sale</h2>
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCart())}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
          {/* Customer */}
          <button className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600">
            <User className="h-4 w-4" />
            {customerName}
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <ShoppingBag className="mb-2 h-10 w-10" />
              <p className="text-sm">No items in cart</p>
              <p className="text-xs">Search or click products to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-lg border border-gray-100 p-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity - 1,
                            })
                          )
                        }
                        className="rounded-md border border-gray-200 p-1 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                            })
                          )
                        }
                        className="rounded-md border border-gray-200 p-1 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item.productId))}
                      className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart totals */}
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-3 flex gap-1.5">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.value}
                  onClick={() => dispatch(setPaymentMethod(pm.value))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    paymentMethod === pm.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Paid amount */}
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Amount Received
            </label>
            <input
              type="number"
              value={paidAmount || ""}
              onChange={(e) => dispatch(setPaidAmount(Number(e.target.value)))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="0.00"
            />
            {change > 0 && (
              <p className="mt-1 text-right text-sm font-semibold text-green-600">
                Change: {formatCurrency(change)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={items.length === 0}
            >
              <ShoppingBag className="h-4 w-4" />
              Complete Sale
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-gray-500 hover:bg-gray-50">
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
