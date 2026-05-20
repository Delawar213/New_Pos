// ============================================
// Company info — from login `data.companyInfo`
// ============================================

/** Normalized company profile used in UI and receipts. */
export interface CompanyInfo {
  name: string;
  contact: string;
  address: string;
  owner: string;
  termsCondition: string;
  thankyouMessage: string;
  softwareProvided: string;
}

/** Raw shape from API (includes `termsconditon` typo). */
export interface CompanyInfoApi {
  name?: string;
  contact?: string;
  address?: string;
  owner?: string;
  termsconditon?: string;
  termsCondition?: string;
  thankyouMessage?: string;
  softwareProvided?: string;
}
