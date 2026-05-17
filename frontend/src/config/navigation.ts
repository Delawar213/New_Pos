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
  Monitor,
  List,
  PlusCircle,
  Wallet,
  BookOpen,
  Undo2,
  Pencil,
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
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "POS Terminal",
        href: "/pos",
        icon: Monitor,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "Categories", href: "/categories", icon: Tags },
          { label: "Subcategories", href: "/subcategories", icon: Tags },
          { label: "Brands", href: "/brands", icon: Award },
          { label: "Expense Categories", href: "/expense-categories", icon: Receipt },
          { label: "Customer Type", href: "/customer-types", icon: Users },
          { label: "Users", href: "/users", icon: Users },
        ],
      },
      {
        label: "Customer",
        href: "/settings/customer",
        icon: Users,
        children: [{ label: "Customer List", href: "/customers", icon: Users }],
      },
      {
        label: "Products",
        href: "/settings/products",
        icon: Package,
        children: [{ label: "Product List", href: "/products", icon: Package }],
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        label: "Categories",
        href: "/categories",
        icon: Tags,
      },
      {
        label: "Brands",
        href: "/brands",
        icon: Award,
      },
      {
        label: "Products",
        href: "/products",
        icon: Package,
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        children: [
          { label: "Supplier list", href: "/suppliers", icon: List },
          { label: "Supplier ledger", href: "/suppliers/ledger", icon: BookOpen },
          { label: "Supplier payments", href: "/supplier-payments", icon: Wallet },
        ],
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        children: [
          { label: "Customer list", href: "/customers", icon: List },
          { label: "Customer ledger", href: "/customers/ledger", icon: BookOpen },
          { label: "Customer payments", href: "/customer-payments", icon: Wallet },
        ],
      },
      {
        label: "Employees",
        href: "/employees",
        icon: UserCog,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Bank Accounts",
        href: "/bank-accounts",
        icon: Landmark,
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Purchases",
        href: "/purchases",
        icon: ShoppingCart,
        children: [
          { label: "Purchase list", href: "/purchases", icon: List },
          { label: "New purchase", href: "/purchases/new", icon: PlusCircle },
        ],
      },
      {
        label: "Sales",
        href: "/sales",
        icon: ShoppingBag,
        children: [
          { label: "Sales list", href: "/sales", icon: List },
          { label: "Edit sale", href: "/sales/edit", icon: Pencil },
          { label: "Sale return", href: "/sales/return", icon: Undo2 },
        ],
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        children: [
          { label: "General Reports", href: "/reports/general", icon: BarChart3 },
          { label: "Purchase Reports", href: "/reports/purchases", icon: BarChart3 },
          { label: "Supplier Reports", href: "/reports/suppliers", icon: BarChart3 },
          { label: "Customer Reports", href: "/reports/customers", icon: BarChart3 },
          { label: "Stock Reports", href: "/reports/stock", icon: BarChart3 },
          { label: "Profit & Loss", href: "/reports/profit-loss", icon: BarChart3 },
        ],
      },
    ],
  },
];
