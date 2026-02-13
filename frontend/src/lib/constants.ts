// ============================================
// Application Constants
// ============================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "POS System";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7001/api";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
];

export const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

export const PURCHASE_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "received", label: "Received", color: "green" },
  { value: "partial", label: "Partial", color: "blue" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

export const SALE_STATUSES = [
  { value: "completed", label: "Completed", color: "green" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "cancelled", label: "Cancelled", color: "red" },
  { value: "returned", label: "Returned", color: "purple" },
];

export const USER_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "accountant", label: "Accountant" },
];

export const UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilogram" },
  { value: "g", label: "Gram" },
  { value: "l", label: "Liter" },
  { value: "ml", label: "Milliliter" },
  { value: "m", label: "Meter" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
];

export const PAGE_SIZES = [10, 25, 50, 100];
