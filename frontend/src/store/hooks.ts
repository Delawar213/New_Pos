// ============================================
// Typed Redux Hooks
// ============================================
// Always use these hooks instead of plain
// `useDispatch` and `useSelector` for type safety.
// ============================================

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
