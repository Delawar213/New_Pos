"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Purchase, CreatePurchaseRequest, PurchaseDetail } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  useCreatePurchaseMutation,
  useGetPurchasesQuery,
  useGetSuppliersQuery,
  useGetSuppliersDropdownQuery,
} from "@/store/api";

const columns: Column<Purchase>[] = [
  { key: "purchaseCode", label: "Reference" },
  { key: "supplierName", label: "Supplier" },
  {
    key: "purchaseDate",
    label: "Date",
    render: (item) => <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>,
  },
  {
    key: "purchaseDetails",
    label: "Total",
    render: (item) => {
      const total = item.purchaseDetails.reduce((sum, d) => {
        const qty = Number(d.purchaseQuantity || 0);
        const unit = Number(d.purchasePriceExVat || 0);
        return sum + qty * unit;
      }, 0);
      return <span className="font-semibold">{formatCurrency(total)}</span>;
    },
  },
  { key: "invoiceNumber", label: "Invoice" },
  {
    key: "discountPercentage",
    label: "Discount %",
    render: (item) => <span>{item.discountPercentage}%</span>,
  },
  { key: "description", label: "Description" },
  {
    key: "createdDatetime",
    label: "Created",
    render: (item) => <StatusBadge status={item.createdDatetime ? "Created" : "Draft"} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
        <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

export default function PurchasesPage() {
  const { data, isLoading } = useGetPurchasesQuery({ pageNumber: 1, pageSize: 10 });
  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();
  const {
    data: suppliersDropdown = [],
    isError: isSuppliersDropdownError,
  } = useGetSuppliersDropdownQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: suppliersListResponse } = useGetSuppliersQuery(
    { pageNumber: 1, pageSize: 100 },
    { refetchOnMountOrArgChange: true }
  );
  const purchases = data?.data.data || [];
  const totalCount = data?.data.totalRecords || 0;
  const suppliers =
    suppliersDropdown.length > 0
      ? suppliersDropdown
      : (suppliersListResponse?.data.data || []).map((s) => ({
          supplierId: s.supplierId,
          supplierCode: s.supplierCode,
          supplierName: s.supplierName,
          currentBalance: s.currentBalance ?? 0,
        }));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreatePurchaseRequest>({
    supplierId: 1,
    purchaseDate: "",
    invoiceNumber: "",
    discountPercentage: 0,
    description: "",
    notes: "",
    createdBy: "admin",
    purchaseDetails: [
      {
        productId: 0,
        barcode: "",
        batchNumber: "",
        expiryDate: null,
        purchasePriceExVat: 0,
        discountPerUnit: 0,
        vatRate: 20,
        sellingPriceExVat: 0,
        purchaseQuantity: 1,
      },
    ],
  });

  const updateDetail = (index: number, patch: Partial<PurchaseDetail>) => {
    setForm((prev) => ({
      ...prev,
      purchaseDetails: prev.purchaseDetails.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
  };

  const addDetailRow = () => {
    setForm((prev) => ({
      ...prev,
      purchaseDetails: [
        ...prev.purchaseDetails,
        {
          productId: 0,
          barcode: "",
          batchNumber: "",
          expiryDate: null,
          purchasePriceExVat: 0,
          discountPerUnit: 0,
          vatRate: 20,
          sellingPriceExVat: 0,
          purchaseQuantity: 1,
        },
      ],
    }));
  };

  const removeDetailRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      purchaseDetails:
        prev.purchaseDetails.length > 1
          ? prev.purchaseDetails.filter((_, i) => i !== index)
          : prev.purchaseDetails,
    }));
  };

  const handleCreatePurchase = async () => {
    const validDetails = form.purchaseDetails.filter((d) => d.productId > 0 && d.purchaseQuantity > 0);
    if (!form.purchaseDate || !form.invoiceNumber.trim() || form.supplierId <= 0 || validDetails.length === 0) {
      return;
    }

    const payload: CreatePurchaseRequest = {
      ...form,
      purchaseDetails: validDetails,
    };

    const result = await createPurchase(payload);
    if (!("error" in result)) {
      setModalOpen(false);
      setForm({
        supplierId: 1,
        purchaseDate: "",
        invoiceNumber: "",
        discountPercentage: 0,
        description: "",
        notes: "",
        createdBy: "admin",
        purchaseDetails: [
          {
            productId: 0,
            barcode: "",
            batchNumber: "",
            expiryDate: null,
            purchasePriceExVat: 0,
            discountPerUnit: 0,
            vatRate: 20,
            sellingPriceExVat: 0,
            purchaseQuantity: 1,
          },
        ],
      });
    }
  };

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
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => setModalOpen(true)}
        addLabel="Add Purchase"
        onFilter={() => {}}
        onExport={() => {}}
        loading={isLoading}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Purchase"
        description="Create purchase with one or more detail rows"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleCreatePurchase}
              disabled={creating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Saving..." : "Save Purchase"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
              {isSuppliersDropdownError && suppliers.length > 0 && (
                <p className="mb-1 text-xs text-amber-600">
                  Dropdown endpoint timeout, showing supplier list fallback.
                </p>
              )}
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value={0}>Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.supplierCode} - {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Purchase Date *</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Invoice Number *</label>
              <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount %</label>
              <input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Created By</label>
              <input value={form.createdBy || ""} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} />
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Purchase Details</p>
              <button onClick={addDetailRow} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">
                + Add Row
              </button>
            </div>
            <div className="space-y-3">
              {form.purchaseDetails.map((detail, index) => (
                <div key={index} className="rounded-md border border-gray-100 p-3">
                  <p className="mb-3 text-xs font-semibold text-slate-600">Detail Row {index + 1}</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Product Id</label>
                      <input type="number" value={detail.productId} onChange={(e) => updateDetail(index, { productId: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Barcode</label>
                      <input value={detail.barcode || ""} onChange={(e) => updateDetail(index, { barcode: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Batch Number</label>
                      <input value={detail.batchNumber || ""} onChange={(e) => updateDetail(index, { batchNumber: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Purchase Quantity</label>
                      <input type="number" value={detail.purchaseQuantity} onChange={(e) => updateDetail(index, { purchaseQuantity: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Purchase Price Ex VAT</label>
                      <input type="number" value={detail.purchasePriceExVat} onChange={(e) => updateDetail(index, { purchasePriceExVat: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Discount Per Unit</label>
                      <input type="number" value={detail.discountPerUnit} onChange={(e) => updateDetail(index, { discountPerUnit: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">VAT Rate %</label>
                      <input type="number" value={detail.vatRate} onChange={(e) => updateDetail(index, { vatRate: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Selling Price Ex VAT</label>
                      <input type="number" value={detail.sellingPriceExVat} onChange={(e) => updateDetail(index, { sellingPriceExVat: Number(e.target.value) || 0 })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Expiry Date</label>
                      <input type="date" value={detail.expiryDate || ""} onChange={(e) => updateDetail(index, { expiryDate: e.target.value || null })} className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeDetailRow(index)}
                        className="w-full rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Remove Row
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
