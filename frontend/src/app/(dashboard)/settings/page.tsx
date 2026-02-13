"use client";

import React from "react";
import { PageHeader } from "@/components/ui";
import { Building2, Globe, Printer, Shield, Bell, Database } from "lucide-react";

const settingsGroups = [
  {
    icon: Building2,
    title: "Business Settings",
    description: "Company name, address, logo, and contact info",
  },
  {
    icon: Globe,
    title: "Regional Settings",
    description: "Currency, timezone, date format, language",
  },
  {
    icon: Printer,
    title: "Invoice & Receipt",
    description: "Invoice template, receipt format, print settings",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Password policy, two-factor auth, session settings",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Email alerts, low stock notifications, reminders",
  },
  {
    icon: Database,
    title: "Backup & Data",
    description: "Database backup, data export/import, cleanup",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="System configuration and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsGroups.map((group) => {
          const Icon = group.icon;
          return (
            <button
              key={group.title}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{group.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
