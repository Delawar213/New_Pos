import { store } from "@/store";
import type { CompanyInfo } from "@/types/company";
import {
  companyDisplayName,
  defaultStoreName,
  hasCompanyText,
  selectCompanyInfo,
} from "@/lib/companyInfo";

export interface PrintBranding {
  storeName: string;
  contact: string;
  address: string;
  owner: string;
  termsCondition: string;
  thankyouMessage: string;
  softwareProvided: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Company profile for print HTML (from persisted login session). */
export function getPrintBranding(): PrintBranding {
  let co: CompanyInfo | null = null;
  try {
    if (typeof window !== "undefined") {
      co = selectCompanyInfo(store.getState());
    }
  } catch {
    co = null;
  }
  return {
    storeName: companyDisplayName(co, defaultStoreName()),
    contact: co?.contact ?? "",
    address: co?.address ?? "",
    owner: co?.owner ?? "",
    termsCondition: co?.termsCondition ?? "",
    thankyouMessage: co?.thankyouMessage ?? "",
    softwareProvided: co?.softwareProvided ?? "",
  };
}

/** Store name + optional contact, address, owner lines for report headers. */
export function buildPrintCompanyHeaderHtml(branding: PrintBranding): string {
  const lines: string[] = [`<p class="store">${escapeHtml(branding.storeName)}</p>`];
  if (hasCompanyText(branding.contact)) {
    lines.push(`<p class="company-line">${escapeHtml(branding.contact)}</p>`);
  }
  if (hasCompanyText(branding.address)) {
    lines.push(`<p class="company-line">${escapeHtml(branding.address)}</p>`);
  }
  if (hasCompanyText(branding.owner)) {
    lines.push(`<p class="company-line">Owner: ${escapeHtml(branding.owner)}</p>`);
  }
  return lines.join("\n    ");
}

/** Optional footer block for terms / thank-you / software credit. */
export function buildPrintCompanyFooterHtml(branding: PrintBranding): string {
  const parts: string[] = [];
  if (hasCompanyText(branding.termsCondition)) {
    parts.push(
      `<p class="print-terms">${escapeHtml(branding.termsCondition).replace(/\n/g, "<br/>")}</p>`
    );
  }
  if (hasCompanyText(branding.thankyouMessage)) {
    parts.push(`<p class="print-thanks">${escapeHtml(branding.thankyouMessage)}</p>`);
  }
  if (hasCompanyText(branding.softwareProvided)) {
    parts.push(`<p class="print-software">${escapeHtml(branding.softwareProvided)}</p>`);
  }
  return parts.length ? `<div class="print-footer">${parts.join("")}</div>` : "";
}

/** Shared print CSS snippet for company header lines. */
export const PRINT_COMPANY_HEADER_STYLES = `
    .store { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .company-line { margin: 2px 0 0; font-size: 10px; color: #475569; line-height: 1.4; }
    .print-footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1; text-align: center; }
    .print-terms { font-size: 9px; color: #64748b; line-height: 1.45; margin: 0 0 6px; }
    .print-thanks { font-size: 10px; font-weight: 600; color: #334155; margin: 0 0 4px; }
    .print-software { font-size: 8px; color: #94a3b8; margin: 0; }
`;
