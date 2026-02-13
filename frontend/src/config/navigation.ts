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
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
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
        label: "Expense Categories",
        href: "/expense-categories",
        icon: Receipt,
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
      },
      {
        label: "Sales",
        href: "/sales",
        icon: ShoppingBag,
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
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];
