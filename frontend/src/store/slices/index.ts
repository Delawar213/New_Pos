import { baseApi } from '../api/baseApi';
import { authSliceConfig } from './auth/auth.slice';
import { cartSliceConfig } from './cart/cart.slice';
import { uiSliceConfig } from './ui/ui.slice';
import { categorySliceConfig } from './category/category.slice';

export const slices = {
  auth: authSliceConfig,
  cart: cartSliceConfig,
  ui: uiSliceConfig,
  category: categorySliceConfig,
};

export const reducers = {
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceConfig.reducer,
  cart: cartSliceConfig.reducer,
  ui: uiSliceConfig.reducer,
  category: categorySliceConfig.reducer,
};
