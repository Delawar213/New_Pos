"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CompanyProfileCard } from "@/components/company/CompanyProfileCard";
import { useAppSelector } from "@/store/hooks";
import { Building2, Globe, Printer, Shield, Bell, Database, ChevronRight } from "lucide-react";

const settingsGroups = [
  {
    icon: Globe,
    title: "Regional Settings",
    description: "Currency, timezone, date format, language",
    href: null as string | null,
  },
  {
    icon: Printer,
    title: "Invoice & Receipt",
    description: "Invoice template, receipt format, print settings",
    href: null,
  },
  {
    icon: Shield,
    title: "Security",
    description: "Password policy, two-factor auth, session settings",
    href: null,
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Email alerts, low stock notifications, reminders",
    href: null,
  },
  {
    icon: Database,
    title: "Backup & Data",
    description: "Database backup, data export/import, cleanup",
    href: null,
  },
];

export default function SettingsPage() {
  const companyInfo = useAppSelector((s) => s.auth.companyInfo);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="System configuration and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Company profile</h2>
              <p className="text-xs text-slate-500">From login — shown on printed receipts</p>
            </div>
          </div>
          <Link
            href="/settings/company"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View full profile
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <CompanyProfileCard company={companyInfo} />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsGroups.map((group) => {
          const Icon = group.icon;
          const inner = (
            <>
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{group.description}</p>
              </div>
            </>
          );
          if (group.href) {
            return (
              <Link
                key={group.title}
                href={group.href}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={group.title}
              type="button"
              disabled
              className="flex cursor-not-allowed items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left opacity-60"
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
