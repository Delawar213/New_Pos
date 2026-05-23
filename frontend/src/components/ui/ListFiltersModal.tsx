"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { ListFiltersState } from "@/lib/listFilters";
import { emptyListFilters } from "@/lib/listFilters";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface ListFiltersModalProps {
  open: boolean;
  onClose: () => void;
  filters: ListFiltersState;
  onApply: (filters: ListFiltersState) => void;
  title?: string;
  statusOptions?: FilterSelectOption[];
  paymentStatusOptions?: FilterSelectOption[];
  showDueFilter?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export default function ListFiltersModal({
  open,
  onClose,
  filters,
  onApply,
  title = "Filter list",
  statusOptions = [],
  paymentStatusOptions = [],
  showDueFilter = false,
}: ListFiltersModalProps) {
  const [draft, setDraft] = useState<ListFiltersState>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const handleClear = () => {
    const cleared = emptyListFilters();
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Narrow the list by date, status, or payment. Apply to refresh results."
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply filters
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.useDateRange}
            onChange={(e) => setDraft({ ...draft, useDateRange: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Filter by date range
        </label>

        {draft.useDateRange ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">From</label>
              <input
                type="date"
                value={draft.fromDate}
                onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">To</label>
              <input
                type="date"
                value={draft.toDate}
                onChange={(e) => setDraft({ ...draft, toDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        ) : null}

        {statusOptions.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {paymentStatusOptions.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Payment</label>
            <select
              value={draft.paymentStatus}
              onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value })}
              className={inputClass}
            >
              <option value="">All payment states</option>
              {paymentStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showDueFilter ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Balance due</label>
            <select
              value={draft.dueFilter}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  dueFilter: e.target.value as ListFiltersState["dueFilter"],
                })
              }
              className={inputClass}
            >
              <option value="all">All sales</option>
              <option value="with_due">With amount due</option>
              <option value="fully_paid">Fully paid (no due)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Balance filter applies to rows on the current result set.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
