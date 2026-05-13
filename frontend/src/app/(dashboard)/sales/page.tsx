"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Sale } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSales,
  fetchSaleById,
  clearSelectedSale,
} from "@/store/slices/sale/sale.slice";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";
import { Loader2, X } from "lucide-react";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);
  const { sales, totalCount, loading, error, selectedSale, actionLoading } = useAppSelector(
    (s) => s.sale
  );

  useEffect(() => {
    void dispatch(fetchSales(buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, page, pageSize]);

  const openSaleDetail = useCallback(
    (item: Sale) => {
      dispatch(clearSelectedSale());
      setDetailOpen(true);
      void dispatch(fetchSaleById(item.id));
    },
    [dispatch]
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    dispatch(clearSelectedSale());
  }, [dispatch]);

  const columns = useMemo(
    (): Column<Sale>[] => [
      { key: "invoiceNo", label: "Invoice" },
      { key: "customerName", label: "Customer" },
      { key: "saleDate", label: "Date" },
      {
        key: "grandTotal",
        label: "Total",
        render: (item) => (
          <span className="font-semibold">{formatCurrency(item.grandTotal)}</span>
        ),
      },
      {
        key: "paidAmount",
        label: "Paid",
        render: (item) => <span>{formatCurrency(item.paidAmount)}</span>,
      },
      {
        key: "dueAmount",
        label: "Due",
        render: (item) => (
          <span
            className={item.dueAmount > 0 ? "font-semibold text-red-600" : "text-gray-500"}
          >
            {formatCurrency(item.dueAmount)}
          </span>
        ),
      },
      {
        key: "paymentMethod",
        label: "Payment",
        render: (item) =>
          item.paymentMethod ? (
            <StatusBadge status={item.paymentMethod} variant="soft" size="sm" />
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "actions",
        label: "Actions",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openSaleDetail(item)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-slate-400"
              disabled
              title="Coming soon"
            >
              Print
            </button>
          </div>
        ),
      },
    ],
    [openSaleDetail]
  );

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Manage sales and invoices"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales" },
        ]}
      />
      {error && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      <DataTable
        columns={columns}
        data={sales}
        rowKey="id"
        title="All Sales"
        totalCount={totalCount}
        pageNumber={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search invoice, customer…"
        onAdd={() => {}}
        addLabel="New Sale"
        onFilter={() => {}}
        onExport={() => {}}
        onRefresh={() =>
          void dispatch(
            fetchSales({
              pageNumber: page,
              pageSize,
              sortDirection: "desc",
              searchTerm: debouncedSearch.trim() || undefined,
            })
          )
        }
        loading={loading}
      />

      {detailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sale-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={closeDetail}
          />
          <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <h2 id="sale-detail-title" className="text-lg font-bold text-slate-900">
                Sale details
              </h2>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {actionLoading && !selectedSale ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading sale…</span>
                </div>
              ) : selectedSale ? (
                <div className="space-y-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-500">Invoice</span>
                      <br />
                      <span className="text-base font-bold text-slate-900">
                        {selectedSale.invoiceNo}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Customer</span>
                      <br />
                      <span className="text-slate-900">
                        {selectedSale.customerName ?? "—"}{" "}
                        {selectedSale.customerId != null ? (
                          <span className="text-xs tabular-nums text-slate-400">
                            (ID {selectedSale.customerId})
                          </span>
                        ) : null}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Date</span>
                      <br />
                      <span className="text-slate-900">{selectedSale.saleDate}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Status</span>
                      <br />
                      <StatusBadge status={selectedSale.status} />
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Payment</span>
                      <br />
                      {selectedSale.paymentMethod ? (
                        <StatusBadge status={selectedSale.paymentMethod} variant="soft" />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">Totals</span>
                      <br />
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(selectedSale.grandTotal)} inc VAT
                      </span>
                      <span className="block text-xs text-slate-500">
                        Paid {formatCurrency(selectedSale.paidAmount)} · Due{" "}
                        {formatCurrency(selectedSale.dueAmount)}
                      </span>
                    </p>
                  </div>
                  {selectedSale.note ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                      <span className="font-semibold text-slate-500">Note · </span>
                      {selectedSale.note}
                    </p>
                  ) : null}
                  <div>
                    <h3 className="mb-2 font-bold text-slate-800">Line items</h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                          <tr>
                            <th className="px-2 py-2 sm:px-3">Product</th>
                            <th className="px-2 py-2 sm:px-3">Qty</th>
                            <th className="px-2 py-2 sm:px-3">Price ex VAT</th>
                            <th className="px-2 py-2 sm:px-3">VAT</th>
                            <th className="px-2 py-2 text-right sm:px-3">Line total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedSale.items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                No line items in response.
                              </td>
                            </tr>
                          ) : (
                            selectedSale.items.map((line) => (
                              <tr key={line.id} className="text-slate-800">
                                <td className="px-2 py-2 sm:px-3">
                                  <span className="font-semibold">{line.productName ?? "—"}</span>
                                  {line.sku ? (
                                    <span className="ml-1 text-xs text-slate-500">{line.sku}</span>
                                  ) : null}
                                </td>
                                <td className="px-2 py-2 tabular-nums sm:px-3">{line.quantity}</td>
                                <td className="px-2 py-2 tabular-nums sm:px-3">
                                  {formatCurrency(line.unitPrice)}
                                </td>
                                <td className="px-2 py-2 tabular-nums sm:px-3">
                                  {formatCurrency(line.taxAmount)}
                                </td>
                                <td className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3">
                                  {formatCurrency(line.total)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-slate-600">
                  Could not load this sale. Close and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
