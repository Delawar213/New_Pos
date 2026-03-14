"use client";

// ============================================
// App Context - Simple State Management
// ============================================
// Replaces Redux store with React Context
// For UI state, auth, and cart management
// ============================================

import React, { createContext, useContext, useState, ReactNode } from "react";

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  taxPercentage: number;
  discountValue: number;
  maxQuantity: number;
}

interface AppContextType {
  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Cart State
  cartItems: CartItem[];
  customerName: string;
  paymentMethod: string;
  paidAmount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setCustomer: (name: string) => void;
  setPaymentMethod: (method: string) => void;
  setPaidAmount: (amount: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartTax: () => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Auth State (demo user for design purposes)
  const [user, setUser] = useState<User | null>({
    id: 1,
    name: "Admin User",
    email: "admin@flexpos.com",
    role: "Admin",
  });

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethodState] = useState("cash");
  const [paidAmount, setPaidAmountState] = useState(0);

  // UI Functions
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSidebarCollapse = () => setSidebarCollapsed((prev) => !prev);

  // Auth Functions
  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  // Cart Functions
  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQuantity) }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) }
          : i
      )
    );
  };

  const setCustomer = (name: string) => setCustomerName(name);
  const setPaymentMethod = (method: string) => setPaymentMethodState(method);
  const setPaidAmount = (amount: number) => setPaidAmountState(amount);

  const clearCart = () => {
    setCartItems([]);
    setCustomerName("");
    setPaymentMethodState("cash");
    setPaidAmountState(0);
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const discount = item.discountValue || 0;
      return sum + (itemTotal - discount);
    }, 0);
  };

  const getCartTax = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const discount = item.discountValue || 0;
      const taxableAmount = itemTotal - discount;
      return sum + (taxableAmount * (item.taxPercentage / 100));
    }, 0);
  };

  const getCartTotal = () => {
    return getCartSubtotal() + getCartTax();
  };

  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value: AppContextType = {
    // UI
    sidebarOpen,
    sidebarCollapsed,
    theme,
    setSidebarOpen,
    setSidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapse,
    setTheme,
    // Auth
    user,
    isAuthenticated: !!user,
    login,
    logout,
    // Cart
    cartItems,
    customerName,
    paymentMethod,
    paidAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    setCustomer,
    setPaymentMethod,
    setPaidAmount,
    clearCart,
    getCartSubtotal,
    getCartTax,
    getCartTotal,
    getCartItemCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
