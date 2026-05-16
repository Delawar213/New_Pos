import { authSliceConfig } from './auth/auth.slice';
import { cartSliceConfig } from './cart/cart.slice';
import { uiSliceConfig } from './ui/ui.slice';
import { categorySliceConfig } from './category/category.slice';
import { brandSliceConfig } from './brand/brand.slice';
import { supplierSliceConfig } from './supplier/supplier.slice';
import { customerSliceConfig } from './customer/customer.slice';
import { employeeSliceConfig } from './employee/employee.slice';
import { expenseCategorySliceConfig } from './expenseCategory/expenseCategory.slice';
import { subCategorySliceConfig } from './subCategory/subCategory.slice';
import { productSliceConfig } from './product/product.slice';
import { bankAccountSliceConfig } from './bankAccount/bankAccount.slice';
import { purchasesSliceConfig } from './purchases/purchases.slice';
import { transactionSliceConfig } from './transaction/transaction.slice';
import { saleSliceConfig } from './sale/sale.slice';
import { dashboardSliceConfig } from './dashboard/dashboard.slice';
import { userSliceConfig } from './user/user.slice';

export const slices = {
  auth: authSliceConfig,
  cart: cartSliceConfig,
  ui: uiSliceConfig,
  category: categorySliceConfig,
  brand: brandSliceConfig,
  supplier: supplierSliceConfig,
  customer: customerSliceConfig,
  employee: employeeSliceConfig,
  expenseCategory: expenseCategorySliceConfig,
  subCategory: subCategorySliceConfig,
  product: productSliceConfig,
  bankAccount: bankAccountSliceConfig,
  purchases: purchasesSliceConfig,
  transaction: transactionSliceConfig,
  sale: saleSliceConfig,
  dashboard: dashboardSliceConfig,
  user: userSliceConfig,
};

export const reducers = {
  auth: authSliceConfig.reducer,
  cart: cartSliceConfig.reducer,
  ui: uiSliceConfig.reducer,
  category: categorySliceConfig.reducer,
  brand: brandSliceConfig.reducer,
  supplier: supplierSliceConfig.reducer,
  customer: customerSliceConfig.reducer,
  employee: employeeSliceConfig.reducer,
  expenseCategory: expenseCategorySliceConfig.reducer,
  subCategory: subCategorySliceConfig.reducer,
  product: productSliceConfig.reducer,
  bankAccount: bankAccountSliceConfig.reducer,
  purchases: purchasesSliceConfig.reducer,
  transaction: transactionSliceConfig.reducer,
  sale: saleSliceConfig.reducer,
  dashboard: dashboardSliceConfig.reducer,
  user: userSliceConfig.reducer,
};
