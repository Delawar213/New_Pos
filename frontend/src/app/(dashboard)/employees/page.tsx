"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  clearEmployeeState,
} from "@/store/slices/employee/employee.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from "@/types";

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const { employees, loading, actionLoading, error, success, message, currentPage, pageSize, totalCount } =
    useAppSelector((state) => state.employee);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeeRequest>({
    employeeCode: "",
    employeeName: "",
    contactNo: "",
    email: "",
    address: "",
    postcode: "",
    nationalInsuranceNumber: "",
    dateOfJoining: "",
    isDaily: false,
    monthlySalary: 0,
    dailyRate: null,
    isActive: true,
    createdBy: "1",
  });

  useEffect(() => {
    dispatch(fetchEmployees({ pageNumber: 1, pageSize: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearEmployeeState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearEmployeeState());
    }
  }, [success, error, message, dispatch]);

  const resetForm = () => {
    setForm({
      employeeCode: "",
      employeeName: "",
      contactNo: "",
      email: "",
      address: "",
      postcode: "",
      nationalInsuranceNumber: "",
      dateOfJoining: "",
      isDaily: false,
      monthlySalary: 0,
      dailyRate: null,
      isActive: true,
      createdBy: "1",
    });
    setEditingEmployee(null);
  };

  const handleSubmit = async () => {
    if (!form.employeeCode.trim() || !form.employeeName.trim() || !form.dateOfJoining) {
      dispatch(addToast({ type: "error", title: "Validation Error", message: "Code, Name and Joining Date are required", duration: 3000 }));
      return;
    }

    if (editingEmployee) {
      const payload: UpdateEmployeeRequest = {
        employeeId: editingEmployee.employeeId,
        employeeCode: form.employeeCode,
        employeeName: form.employeeName,
        contactNo: form.contactNo,
        email: form.email,
        address: form.address,
        postcode: form.postcode,
        nationalInsuranceNumber: form.nationalInsuranceNumber,
        dateOfJoining: form.dateOfJoining,
        isDaily: form.isDaily,
        monthlySalary: form.isDaily ? null : form.monthlySalary,
        dailyRate: form.isDaily ? form.dailyRate : null,
        isActive: form.isActive,
        updatedBy: "admin",
      };
      const result = await dispatch(updateEmployee(payload));
      if (updateEmployee.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchEmployees({ pageNumber: currentPage, pageSize }));
      }
      return;
    }

    const payload: CreateEmployeeRequest = {
      ...form,
      monthlySalary: form.isDaily ? null : form.monthlySalary,
      dailyRate: form.isDaily ? form.dailyRate : null,
    };
    const result = await dispatch(createEmployee(payload));
    if (createEmployee.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchEmployees({ pageNumber: currentPage, pageSize }));
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      contactNo: employee.contactNo || "",
      email: employee.email || "",
      address: employee.address || "",
      postcode: employee.postcode || "",
      nationalInsuranceNumber: employee.nationalInsuranceNumber || "",
      dateOfJoining: employee.dateOfJoining?.split("T")[0] || "",
      isDaily: employee.isDaily,
      monthlySalary: employee.monthlySalary ?? 0,
      dailyRate: employee.dailyRate ?? null,
      isActive: employee.isActive,
      createdBy: "1",
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    const result = await dispatch(deleteEmployee(employeeToDelete.employeeId));
    if (deleteEmployee.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      dispatch(fetchEmployees({ pageNumber: currentPage, pageSize }));
    }
  };

  const columns: Column<Employee>[] = [
    { key: "employeeId", label: "#", className: "w-16" },
    { key: "employeeCode", label: "Code" },
    { key: "employeeName", label: "Name" },
    { key: "contactNo", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "isDaily",
      label: "Type",
      render: (item) => <span>{item.isDaily ? "Daily" : "Monthly"}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
          <button
            onClick={() => {
              setEmployeeToDelete(item);
              setDeleteConfirmOpen(true);
            }}
            disabled={actionLoading}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employees and roles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employees" },
        ]}
      />
      <DataTable
        columns={columns}
        data={employees}
        rowKey="employeeId"
        title="All Employees"
        totalCount={totalCount}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
        addLabel="Add Employee"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
        description={editingEmployee ? "Update employee details" : "Create a new employee"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} disabled={actionLoading} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={actionLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {actionLoading ? "Saving..." : editingEmployee ? "Update Employee" : "Save Employee"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Employee Code *</label>
            <input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Employee Name *</label>
            <input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contact No</label>
            <input value={form.contactNo || ""} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Postcode</label>
            <input value={form.postcode || ""} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">National Insurance Number</label>
            <input value={form.nationalInsuranceNumber || ""} onChange={(e) => setForm({ ...form, nationalInsuranceNumber: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date Of Joining *</label>
            <input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isDaily} onChange={(e) => setForm({ ...form, isDaily: e.target.checked })} className="rounded border-gray-300" />
              Daily Paid Employee
            </label>
          </div>
          {form.isDaily ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Daily Rate</label>
              <input type="number" value={form.dailyRate ?? 0} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Salary</label>
              <input type="number" value={form.monthlySalary ?? 0} onChange={(e) => setForm({ ...form, monthlySalary: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          )}
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
              Active
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={3} />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEmployeeToDelete(null);
        }}
        title="Delete Employee"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">You are about to delete employee:</p>
            <p className="text-base font-semibold text-slate-800 mb-4">&quot;{employeeToDelete?.employeeName}&quot;</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={handleDeleteConfirm} disabled={actionLoading} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {actionLoading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
