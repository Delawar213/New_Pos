// ============================================
// Sidebar Navigation Config
// ============================================

import {
  LayoutDashboard,
  Tags,
  Award,
  Package,
  Truck,
  Users,
  UserCog,
  Landmark,
  Receipt,
  ArrowLeftRight,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Settings,
  Building2,
  Monitor,
  List,
  PlusCircle,
  Wallet,
  BookOpen,
  Undo2,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const sidebarNavigation: NavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "POS Terminal", href: "/pos", icon: Monitor },
    ],
  },
  {
    title: "Sales & purchases",
    items: [
      {
        label: "Sales",
        href: "/sales",
        icon: ShoppingBag,
        children: [
          { label: "All sales", href: "/sales", icon: List },
          { label: "Sale return", href: "/sales/return", icon: Undo2 },
        ],
      },
      {
        label: "Purchases",
        href: "/purchases",
        icon: ShoppingCart,
        children: [
          { label: "All purchases", href: "/purchases", icon: List },
          { label: "New purchase", href: "/purchases/new", icon: PlusCircle },
        ],
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Subcategories", href: "/subcategories", icon: Tags },
      { label: "Brands", href: "/brands", icon: Award },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "All customers", href: "/customers", icon: Users },
      { label: "Pending payments", href: "/customers/pending-payments", icon: Clock },
      { label: "Receive payment", href: "/customer-payments", icon: Wallet },
      { label: "Customer ledger", href: "/customers/ledger", icon: BookOpen },
    ],
  },
  {
    title: "Suppliers",
    items: [
      { label: "All suppliers", href: "/suppliers", icon: Truck },
      { label: "Supplier payments", href: "/supplier-payments", icon: Wallet },
      { label: "Supplier ledger", href: "/suppliers/ledger", icon: BookOpen },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Bank accounts", href: "/bank-accounts", icon: Landmark },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ArrowLeftRight,
        children: [
          { label: "Ledger", href: "/transactions", icon: List },
          { label: "Record payment", href: "/transactions/new", icon: PlusCircle },
          { label: "Record expense", href: "/transactions/expense", icon: Receipt },
          { label: "Record transfer", href: "/transactions/transfer", icon: ArrowLeftRight },
        ],
      },
    ],
  },
  {
    title: "Team",
    items: [{ label: "Employees", href: "/employees", icon: UserCog }],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        children: [
          { label: "Overview", href: "/reports", icon: BarChart3 },
          { label: "General", href: "/reports/general", icon: BarChart3 },
          { label: "Purchases", href: "/reports/purchases", icon: BarChart3 },
          { label: "Suppliers", href: "/reports/suppliers", icon: BarChart3 },
          { label: "Customers", href: "/reports/customers", icon: BarChart3 },
          { label: "Stock", href: "/reports/stock", icon: BarChart3 },
          { label: "Profit & loss", href: "/reports/profit-loss", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "App settings", href: "/settings", icon: Settings },
      { label: "Company profile", href: "/settings/company", icon: Building2 },
      { label: "Users", href: "/users", icon: Users },
      { label: "Customer types", href: "/customer-types", icon: Users },
      { label: "Expense categories", href: "/expense-categories", icon: Receipt },
    ],
  },
];
