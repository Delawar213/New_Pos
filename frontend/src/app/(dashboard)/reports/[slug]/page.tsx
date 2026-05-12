"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ArrowLeft, BarChart3 } from "lucide-react";

const TITLES: Record<string, string> = {
  general: "General Reports",
  purchases: "Purchase Reports",
  suppliers: "Supplier Reports",
  customers: "Customer Reports",
  stock: "Stock Reports",
  "profit-loss": "Profit & Loss",
};

export default function ReportSectionPage() {
  const params = useParams();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  const title = TITLES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>
      <PageHeader title={title} description="Report view — connect your data source when ready." />
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-slate-300" />
        <p className="max-w-md text-slate-600">
          This section is reserved for <span className="font-semibold text-slate-800">{title}</span>. Add charts
          and tables here or link to your reporting API.
        </p>
      </div>
    </div>
  );
}
