"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { CompanyProfileCard } from "@/components/company/CompanyProfileCard";
import { useAppSelector } from "@/store/hooks";

export default function CompanyProfilePage() {
  const companyInfo = useAppSelector((s) => s.auth.companyInfo);

  return (
    <div className="space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <PageHeader
        title="Company profile"
        description="Business details from your login — used on receipts and reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/settings" },
          { label: "Company profile" },
        ]}
      />

      <div className="max-w-2xl">
        <CompanyProfileCard company={companyInfo} />
      </div>
    </div>
  );
}
