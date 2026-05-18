"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { addToast } from "@/store/slices/ui/ui.slice";
import { printPosReceipt, buildPosReceiptSnapshotFromSale } from "@/lib/posReceipt";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";
import { SaleDetailModal } from "@/components/sales/SaleDetailModal";
import { SalePaymentModal } from "@/components/sales/SalePaymentModal";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);
  const { sales, totalCount, loading, error, selectedSale, actionLoading } = useAppSelector(
    (s) => s.sale
  );

  const salesListParams = useMemo(
    () =>
      buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef, {
        sortBy: "saleDate",
        sortDirection: "desc",
      }),
    [page, pageSize, debouncedSearch]
  );

  useEffect(() => {
    void dispatch(fetchSales(salesListParams));
  }, [dispatch, salesListParams]);

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

  const openSalePayment = useCallback((item: Sale) => {
    setPaymentSale(item);
    setPaymentOpen(true);
  }, []);

  const closeSalePayment = useCallback(() => {
    setPaymentOpen(false);
    setPaymentSale(null);
  }, []);

  const refreshSalesList = useCallback(() => {
    void dispatch(
      fetchSales({
        pageNumber: page,
        pageSize,
        sortBy: "saleDate",
        sortDirection: "desc",
        searchTerm: debouncedSearch.trim() || undefined,
      })
    );
  }, [dispatch, page, pageSize, debouncedSearch]);

  const printSaleReceipt = useCallback(
    async (saleId: number) => {
      try {
        const full = await dispatch(
          fetchSaleById({ id: saleId, updateSelection: false })
        ).unwrap();
        printPosReceipt(buildPosReceiptSnapshotFromSale(full));
      } catch {
        dispatch(
          addToast({
            type: "error",
            title: "Print failed",
            message: "Could not load this sale for printing.",
          })
        );
      }
    },
    [dispatch]
  );

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
            <Link
              href={`/sales/edit?saleId=${item.id}`}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void printSaleReceipt(item.id);
              }}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Print
            </button>
            {item.dueAmount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openSalePayment(item);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Pay
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [openSaleDetail, openSalePayment, printSaleReceipt]
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
        sortNewestFirst
      />

      <SaleDetailModal
        open={detailOpen}
        onClose={closeDetail}
        sale={selectedSale}
        loading={actionLoading}
      />

      <SalePaymentModal
        open={paymentOpen}
        onClose={closeSalePayment}
        sale={paymentSale}
        onSuccess={refreshSalesList}
      />
    </div>
  );
}
