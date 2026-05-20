// ============================================
// Dashboard Types — GET /api/Dashboard/summary
// ============================================

export interface DashboardTopSellingProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface DashboardRecentTransaction {
  transactionId: number;
  transactionCode: string;
  transactionDate: string;
  title: string;
  amount: number;
  status: string;
}

export interface DashboardSummary {
  todaySales: number;
  todayPurchases: number;
  todayExpenses: number;
  todayProfit: number;
  monthSales: number;
  monthPurchases: number;
  monthExpenses: number;
  monthProfit: number;
  cashInHand: number;
  bankBalance: number;
  totalReceivables: number;
  totalPayables: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingSalesInvoices: number;
  pendingPurchaseInvoices: number;
  topSellingProducts: DashboardTopSellingProduct[];
  recentTransactions: DashboardRecentTransaction[];
}
