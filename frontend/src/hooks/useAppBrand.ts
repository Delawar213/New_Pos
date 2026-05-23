"use client";

import { useAppSelector } from "@/store/hooks";
import { companyDisplayName } from "@/lib/companyInfo";

const DEFAULT_BRAND = "FlexPOS";

/** Business name from login `companyInfo`, else app default. */
export function useAppBrandName(fallback = DEFAULT_BRAND): string {
  const companyInfo = useAppSelector((s) => s.auth.companyInfo);
  return companyDisplayName(companyInfo, fallback);
}
