import type { CompanyInfo, CompanyInfoApi } from "@/types/company";
import type { RootState } from "@/store";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Map login API `companyInfo` to normalized fields. */
export function normalizeCompanyInfo(raw: unknown): CompanyInfo | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as CompanyInfoApi;
  const info: CompanyInfo = {
    name: str(o.name),
    contact: str(o.contact),
    address: str(o.address),
    owner: str(o.owner),
    termsCondition: str(o.termsCondition ?? o.termsconditon),
    thankyouMessage: str(o.thankyouMessage),
    softwareProvided: str(o.softwareProvided),
  };
  const hasAny = Object.values(info).some((v) => v.length > 0);
  return hasAny ? info : null;
}

export function hasCompanyText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

/** Store display name for receipts and headers. */
export function companyDisplayName(
  company: CompanyInfo | null | undefined,
  fallback = "Point of Sale"
): string {
  return company?.name?.trim() || fallback;
}

export function selectCompanyInfo(state: RootState): CompanyInfo | null {
  return state.auth.companyInfo ?? null;
}

/** Env fallback when not logged in or company name missing. */
export function defaultStoreName(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STORE_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_STORE_NAME.trim();
  }
  return "Point of Sale";
}
