"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Purchase } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPurchases,
  fetchPurchaseById,
  deletePurchase,
  clearPurchasesState,
  clearSelectedPurchase,
} from "@/store/slices/purchases/purchases.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";

function lineTotalFromDetails(item: Purchase): number | null {
  const details = item.purchaseDetails;
  if (!details?.length) return null;
  return details.reduce((sum, d) => {
    const qty = Number(d.purchaseQuantity || 0);
    const unit = Number(d.purchasePriceExVat || 0);
    return sum + qty * unit;
  }, 0);
}

export default function PurchasesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);
  const { purchases, totalCount, loading, selectedPurchase, success, message, error } =
    useAppSelector((s) => s.purchases);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Purchase | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void dispatch(fetchPurchases(buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, page, pageSize]);

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearPurchasesState());
      void dispatch(
        fetchPurchases({
          pageNumber: page,
          pageSize,
          sortDirection: "desc",
          searchTerm: debouncedSearch.trim() || undefined,
        })
      );
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearPurchasesState());
    }
  }, [success, error, message, dispatch, page, pageSize, debouncedSearch]);

  const openView = useCallback(
    async (row: Purchase) => {
      setViewOpen(true);
      setViewLoading(true);
      try {
        await dispatch(fetchPurchaseById(row.purchaseId)).unwrap();
      } catch {
        dispatch(
          addToast({
            type: "error",
            title: "Could not load purchase",
            message: "Failed to load full purchase details.",
            duration: 4000,
          })
        );
        setViewOpen(false);
      } finally {
        setViewLoading(false);
      }
    },
    [dispatch]
  );

  const confirmDelete = useCallback((row: Purchase) => {
    setPendingDelete(row);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      const result = await dispatch(deletePurchase(pendingDelete.purchaseId));
      if (deletePurchase.fulfilled.match(result)) {
        setDeleteOpen(false);
        setPendingDelete(null);
      }
    } finally {
      setDeleteBusy(false);
    }
  }, [dispatch, pendingDelete]);

  const columns: Column<Purchase>[] = useMemo(
    () => [
      { key: "purchaseCode", label: "Reference" },
      { key: "supplierName", label: "Supplier" },
      {
        key: "purchaseDate",
        label: "Date",
        render: (item) => <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>,
      },
      {
        key: "totalAmountIncVat",
        label: "Total (inc VAT)",
        render: (item) => {
          const fromApi = item.totalAmountIncVat;
          if (fromApi != null) {
            return <span className="font-semibold">{formatCurrency(Number(fromApi))}</span>;
          }
          const computed = lineTotalFromDetails(item);
          return (
            <span className="font-semibold">
              {computed != null ? formatCurrency(computed) : "—"}
            </span>
          );
        },
      },
      { key: "invoiceNumber", label: "Invoice" },
      {
        key: "discountPercentage",
        label: "Discount %",
        render: (item) => <span>{item.discountPercentage ?? 0}%</span>,
      },
      {
        key: "paymentStatus",
        label: "Payment",
        render: (item) =>
          item.paymentStatus ? <StatusBadge status={item.paymentStatus} /> : <span>—</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (item) =>
          item.status ? <StatusBadge status={item.status} /> : <span>—</span>,
      },
      {
        key: "createdDatetime",
        label: "Created",
        render: (item) =>
          item.createdDatetime ? (
            <span className="text-sm text-gray-600">
              {new Date(item.createdDatetime).toLocaleString()}
            </span>
          ) : (
            <span>—</span>
          ),
      },
      {
        key: "actions",
        label: "Actions",
        className: "relative z-10",
        render: (item) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => void openView(item)}
            >
              View
            </button>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => router.push(`/purchases/new?purchaseId=${item.purchaseId}`)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
              onClick={() => confirmDelete(item)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [router, openView, confirmDelete]
  );

  const viewData = selectedPurchase;

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Manage purchase orders"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchases" },
        ]}
      />
      <DataTable
        columns={columns}
        data={purchases}
        rowKey="purchaseId"
        title="All Purchases"
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
        searchPlaceholder="Search reference, supplier, invoice…"
        onAdd={() => router.push("/purchases/new")}
        addLabel="Add Purchase"
        onFilter={() => {}}
        onExport={() => {}}
        onRefresh={() =>
          void dispatch(
            fetchPurchases({
              pageNumber: page,
              pageSize,
              sortDirection: "desc",
              searchTerm: debouncedSearch.trim() || undefined,
            })
          )
        }
        loading={loading}
      />

      <Modal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          dispatch(clearSelectedPurchase());
        }}
        title="Purchase details"
        description={viewData ? `${viewData.purchaseCode} · ${viewData.supplierName ?? "Supplier"}` : ""}
        size="lg"
      >
        {viewLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : viewData ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Date</span>
                <p className="font-medium">{new Date(viewData.purchaseDate).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Invoice</span>
                <p className="font-medium">{viewData.invoiceNumber ?? "—"}</p>
              </div>
              <div>
                <span className="text-slate-500">Total (inc VAT)</span>
                <p className="font-medium">
                  {viewData.totalAmountIncVat != null
                    ? formatCurrency(Number(viewData.totalAmountIncVat))
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                <p className="font-medium">{viewData.status ?? "—"}</p>
              </div>
            </div>
            {viewData.purchaseDetails && viewData.purchaseDetails.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2 text-right">Price ex VAT</th>
                      <th className="px-3 py-2 text-right">Line ex VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.purchaseDetails.map((d, i) => (
                      <tr key={d.detailId ?? d.purchaseDetailId ?? `${d.productId}-${i}`} className="border-t border-slate-100">
                        <td className="px-3 py-2">{d.productName ?? `Product #${d.productId}`}</td>
                        <td className="px-3 py-2">{d.purchaseQuantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(d.purchasePriceExVat)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {formatCurrency(
                            Number(d.purchaseQuantity) * Number(d.purchasePriceExVat)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">No line items on this response.</p>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setPendingDelete(null);
        }}
        title="Delete purchase"
        description={
          pendingDelete
            ? `Remove purchase ${pendingDelete.purchaseCode} (invoice ${pendingDelete.invoiceNumber ?? "—"})? This cannot be undone if the server allows deletion.`
            : ""
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setPendingDelete(null);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteBusy}
              onClick={() => void handleDelete()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </button>
          </div>
        }
      >
        <span className="sr-only">Confirm deletion in the actions below.</span>
      </Modal>
    </div>
  );
}
