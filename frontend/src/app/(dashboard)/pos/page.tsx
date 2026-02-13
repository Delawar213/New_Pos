"use client";

// ============================================
// POS Terminal Page - Modern Point of Sale
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
  Percent,
  Tag,
  Grid3X3,
  List,
  QrCode,
  Receipt,
  Sparkles,
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
import { cn } from "@/lib/utils";
import type { CartItem } from "@/store/slices/cartSlice";

// Demo products for POS
const availableProducts = [
  { productId: 1, name: "Premium Wall Paint - White", sku: "PWP-001", price: 50, taxPercentage: 5, maxQuantity: 120, discountValue: 0, category: "Paints" },
  { productId: 2, name: "Wood Finish Varnish", sku: "WFV-002", price: 40, taxPercentage: 5, maxQuantity: 80, discountValue: 0, category: "Varnish" },
  { productId: 3, name: "Interior Satin Paint", sku: "ISP-003", price: 55, taxPercentage: 5, maxQuantity: 65, discountValue: 0, category: "Paints" },
  { productId: 4, name: "Exterior Weather Coat", sku: "EWC-004", price: 60, taxPercentage: 5, maxQuantity: 45, discountValue: 0, category: "Paints" },
  { productId: 5, name: "Metal Primer Grey", sku: "MPG-005", price: 35, taxPercentage: 5, maxQuantity: 90, discountValue: 0, category: "Primer" },
  { productId: 6, name: "Spray Paint - Red", sku: "SPR-006", price: 15, taxPercentage: 5, maxQuantity: 200, discountValue: 0, category: "Spray" },
  { productId: 7, name: "Paint Brush Set", sku: "PBS-007", price: 25, taxPercentage: 5, maxQuantity: 150, discountValue: 0, category: "Tools" },
  { productId: 8, name: "Roller Set Pro", sku: "RLS-008", price: 30, taxPercentage: 5, maxQuantity: 100, discountValue: 0, category: "Tools" },
  { productId: 9, name: "Thinner 1L", sku: "THN-009", price: 18, taxPercentage: 5, maxQuantity: 300, discountValue: 0, category: "Chemicals" },
  { productId: 10, name: "Putty 5kg", sku: "PTY-010", price: 45, taxPercentage: 5, maxQuantity: 80, discountValue: 0, category: "Filler" },
];

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Banknote, color: "from-emerald-500 to-teal-500" },
  { value: "card", label: "Card", icon: CreditCard, color: "from-blue-500 to-violet-500" },
  { value: "bank", label: "Bank", icon: Building2, color: "from-amber-500 to-orange-500" },
];

const categories = ["All", "Paints", "Varnish", "Primer", "Spray", "Tools", "Chemicals", "Filler"];

export default function POSPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const tax = useAppSelector(selectCartTax);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const { customerName, paymentMethod, paidAmount } = useAppSelector((s) => s.cart);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = availableProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (product: typeof availableProducts[0]) => {
    dispatch(addToCart({ ...product, quantity: 1 } as CartItem));
  };

  const change = paidAmount > total ? paidAmount - total : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 overflow-hidden -mt-6 -mx-6">
      {/* Left: Products */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50 p-4">
        {/* Search bar & controls */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                autoFocus
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <Barcode className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hidden">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid/List */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm scrollbar-thin">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.productId}
                  onClick={() => handleAddProduct(product)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  {/* Product image placeholder */}
                  <div className="mb-3 flex h-20 w-full items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-300 transition-all group-hover:from-blue-50 group-hover:to-violet-50 group-hover:text-blue-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">{product.sku}</p>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                      {formatCurrency(product.price)}
                    </p>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                      product.maxQuantity > 50 
                        ? "bg-emerald-100 text-emerald-700" 
                        : product.maxQuantity > 10 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-rose-100 text-rose-700"
                    )}>
                      {product.maxQuantity} in stock
                    </span>
                  </div>

                  {/* Quick add indicator */}
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/90 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-2 text-white">
                      <Plus className="h-5 w-5" />
                      <span className="font-semibold">Add to Cart</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.productId}
                  onClick={() => handleAddProduct(product)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-300 transition-all group-hover:from-blue-50 group-hover:to-violet-50 group-hover:text-blue-400">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-400">{product.sku} · {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-slate-400">{product.maxQuantity} in stock</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-violet-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/25">
                    <Plus className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-[400px] flex-col overflow-hidden border-l border-slate-200 bg-white">
        {/* Cart header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/25">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Current Sale</h2>
                <p className="text-xs text-slate-400">{itemCount} items in cart</p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCart())}
                className="flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          
          {/* Customer selector */}
          <button className="mt-4 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm transition-all hover:border-blue-300 hover:bg-blue-50/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-700">{customerName}</p>
              <p className="text-xs text-slate-400">Click to change customer</p>
            </div>
            <Plus className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-600">Cart is empty</p>
              <p className="mt-1 text-sm text-slate-400">Search or click products to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="group rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-800">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        onClick={() => dispatch(updateQuantity({
                          productId: item.productId,
                          quantity: item.quantity - 1,
                        }))}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => dispatch(updateQuantity({
                          productId: item.productId,
                          quantity: item.quantity + 1,
                        }))}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                        <Percent className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => dispatch(removeFromCart(item.productId))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart totals & checkout */}
        <div className="border-t border-slate-100 bg-gradient-to-t from-slate-50 to-white px-5 py-4">
          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax (5%)</span>
              <span className="font-medium text-slate-700">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-xl font-bold text-slate-900">
              <span>Total</span>
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Payment Method
            </p>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.value}
                    onClick={() => dispatch(setPaymentMethod(pm.value))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-semibold transition-all",
                      paymentMethod === pm.value
                        ? `border-transparent bg-gradient-to-r ${pm.color} text-white shadow-lg`
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount received */}
          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amount Received
            </label>
            <input
              type="number"
              value={paidAmount || ""}
              onChange={(e) => dispatch(setPaidAmount(Number(e.target.value)))}
              className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-right text-2xl font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="0.00"
            />
            {change > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2">
                <span className="text-sm font-medium text-emerald-700">Change Due</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              disabled={items.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Sparkles className="h-5 w-5" />
              Complete Sale
            </button>
            <button className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <Printer className="h-5 w-5" />
            </button>
          </div>

          {/* Quick shortcuts */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">F2</kbd> Hold
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">F4</kbd> Discount
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">F12</kbd> Pay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
