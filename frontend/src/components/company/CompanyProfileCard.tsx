"use client";

import React from "react";
import { Building2, MapPin, Phone, User, FileText, Heart, Cpu } from "lucide-react";
import type { CompanyInfo } from "@/types/company";
import { hasCompanyText } from "@/lib/companyInfo";

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  if (!hasCompanyText(value)) return null;
  return (
    <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function CompanyProfileCard({
  company,
  emptyMessage = "No company profile on this account. Log in again after your administrator sets company details.",
}: {
  company: CompanyInfo | null;
  emptyMessage?: string;
}) {
  if (!company) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  const hasVisible = [
    company.name,
    company.contact,
    company.address,
    company.owner,
    company.termsCondition,
    company.thankyouMessage,
    company.softwareProvided,
  ].some((v) => hasCompanyText(v));

  if (!hasVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasCompanyText(company.name) ? (
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-800/80">Business name</p>
              <p className="text-lg font-bold text-slate-900">{company.name}</p>
            </div>
          </div>
        </div>
      ) : null}
      <FieldRow icon={Phone} label="Contact" value={company.contact} />
      <FieldRow icon={MapPin} label="Address" value={company.address} />
      <FieldRow icon={User} label="Owner" value={company.owner} />
      <FieldRow icon={FileText} label="Terms & conditions (on receipt)" value={company.termsCondition} />
      <FieldRow icon={Heart} label="Thank-you message (on receipt)" value={company.thankyouMessage} />
      <FieldRow icon={Cpu} label="Software credit (receipt footer)" value={company.softwareProvided} />
      <p className="text-xs text-slate-500">
        Loaded from your login session. Empty fields are hidden on printed receipts.
      </p>
    </div>
  );
}
