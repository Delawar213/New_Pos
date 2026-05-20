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

/** Query params for GET /api/Dashboard/profit/range */
export interface ProfitRangeParams {
  fromDate: string;
  toDate: string;
}

/** Invoice row in profit range report */
export interface ProfitInvoiceRow {
  saleId: number;
  invoiceNumber: string;
  saleDate: string;
  customerName: string;
  totalItems: number;
  subtotalExVat: number;
  discountAmount: number;
  netAmountExVat: number;
  totalVat: number;
  totalAmountIncVat: number;
  totalCost: number;
  profitAmount: number;
  profitPercentage: number;
  paymentStatus: string;
}

/** `data` from GET /api/Dashboard/profit/range */
export interface ProfitRangeReport {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
  invoices: ProfitInvoiceRow[];
}
