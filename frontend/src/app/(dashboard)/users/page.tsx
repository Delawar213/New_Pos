"use client";

import React, { useEffect, useRef, useState } from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsersPage, clearUserState } from "@/store/slices/user/user.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { UserListRow } from "@/types/user";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list, loading, error, message, currentPage, pageSize, totalCount } = useAppSelector(
    (s) => s.user
  );

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);

  useEffect(() => {
    void dispatch(
      fetchUsersPage(buildPagedFetchArgs(currentPage, pageSize, debouncedSearch, searchPrevRef))
    );
  }, [dispatch, debouncedSearch, currentPage, pageSize]);

  useEffect(() => {
    if (message && !error) {
      dispatch(addToast({ type: "success", title: "Users", message, duration: 2800 }));
      dispatch(clearUserState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Users", message: error, duration: 5000 }));
      dispatch(clearUserState());
    }
  }, [message, error, dispatch]);

  const columns: Column<UserListRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => <span className="font-medium text-slate-800">{r.name}</span>,
    },
    {
      key: "userName",
      label: "Username",
      render: (r) => <span className="text-slate-600">{r.userName}</span>,
    },
    {
      key: "roleName",
      label: "Role",
      render: (r) => <span className="text-slate-600">{r.roleName}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />,
    },
    {
      key: "createdDateTime",
      label: "Created",
      render: (r) => (
        <span className="text-xs text-slate-500">
          {r.createdDateTime ? new Date(r.createdDateTime).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="App users from GET /api/User"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users" },
        ]}
      />

      <DataTable
        columns={columns}
        data={list}
        rowKey="userId"
        title="All users"
        totalCount={totalCount}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageChange={(p) =>
          void dispatch(
            fetchUsersPage({
              pageNumber: p,
              pageSize,
              searchTerm: debouncedSearch.trim() || undefined,
            })
          )
        }
        onPageSizeChange={(s) =>
          void dispatch(
            fetchUsersPage({
              pageNumber: 1,
              pageSize: s,
              searchTerm: debouncedSearch.trim() || undefined,
            })
          )
        }
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search users…"
        loading={loading}
        sortNewestFirst={false}
      />
    </div>
  );
}
