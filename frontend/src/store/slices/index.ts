import { baseApi } from '../api/baseApi';
import { authSliceConfig } from './auth/auth.slice';
import { cartSliceConfig } from './cart/cart.slice';
import { uiSliceConfig } from './ui/ui.slice';
import { categorySliceConfig } from './category/category.slice';
import { brandSliceConfig } from './brand/brand.slice';
import { supplierSliceConfig } from './supplier/supplier.slice';
import { customerSliceConfig } from './customer/customer.slice';
import { employeeSliceConfig } from './employee/employee.slice';
import { expenseCategorySliceConfig } from './expenseCategory/expenseCategory.slice';

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
};

export const reducers = {
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceConfig.reducer,
  cart: cartSliceConfig.reducer,
  ui: uiSliceConfig.reducer,
  category: categorySliceConfig.reducer,
  brand: brandSliceConfig.reducer,
  supplier: supplierSliceConfig.reducer,
  customer: customerSliceConfig.reducer,
  employee: employeeSliceConfig.reducer,
  expenseCategory: expenseCategorySliceConfig.reducer,
};
