// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalProfit: number;
  totalCustomers: number;
  totalProducts: number;
  totalSuppliers: number;
  lowStockProducts: number;
  todaySales: number;
  todayPurchases: number;
  monthlySales: number;
  monthlyPurchases: number;
}

export interface SalesChartData {
  labels: string[];
  data: number[];
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface RecentTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
}
