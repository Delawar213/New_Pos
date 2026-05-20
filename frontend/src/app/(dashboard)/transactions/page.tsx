"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";
import { PageHeader, StatsCard } from "@/components/ui";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import type { Transaction } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransactions } from "@/store/slices/transaction/transaction.slice";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { buildPagedFetchArgs } from "@/lib/buildPagedFetchArgs";
import {
  getTransactionKind,
  isJournalBalanced,
  transactionDisplayAmount,
} from "@/lib/transactionUtils";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const searchPrevRef = useRef<string | null>(null);

  const { transactions, totalCount, totalPages, loading, error } = useAppSelector(
    (s) => s.transaction
  );

  const refresh = () =>
    dispatch(
      fetchTransactions({
        pageNumber: page,
        pageSize,
        sortDirection: "desc",
        searchTerm: debouncedSearch.trim() || undefined,
      })
    );

  useEffect(() => {
    void dispatch(fetchTransactions(buildPagedFetchArgs(page, pageSize, debouncedSearch, searchPrevRef)));
  }, [dispatch, debouncedSearch, page, pageSize]);

  const pageStats = useMemo(() => {
    let volume = 0;
    let lines = 0;
    let balanced = 0;
    for (const tx of transactions) {
      volume += transactionDisplayAmount(tx);
      lines += tx.transactionDetails?.length ?? 0;
      if (isJournalBalanced(tx.transactionDetails ?? [])) balanced += 1;
    }
    const purchases = transactions.filter((t) => getTransactionKind(t) === "purchase").length;
    const sales = transactions.filter((t) => getTransactionKind(t) === "sale").length;
    return { volume, lines, balanced, purchases, sales };
  }, [transactions]);

  const openDetail = (tx: Transaction) => {
    setSelected(tx);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="General ledger"
        description="Double-entry journal postings from sales, purchases, returns, and payments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions" },
        ]}
        actions={
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusCircle className="h-4 w-4" />
            Record transaction
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total records"
          value={totalCount}
          icon={BookOpen}
          color="blue"
          variant="outline"
        />
        <StatsCard
          title="Page volume"
          value={formatCurrency(pageStats.volume)}
          icon={ArrowLeftRight}
          color="indigo"
          variant="outline"
        />
        <StatsCard
          title="Journal lines (page)"
          value={pageStats.lines}
          icon={Scale}
          color="purple"
          variant="outline"
        />
        <StatsCard
          title="Balanced entries"
          value={`${pageStats.balanced} / ${transactions.length}`}
          icon={Scale}
          color="green"
          variant="outline"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search code, title, reference…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-500/20 transition focus:border-blue-500 focus:bg-white focus:ring-4"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      {loading && transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600">Loading transactions…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No transactions found</p>
          <p className="mt-1 text-xs text-slate-500">Try another search or refresh the list.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <TransactionCard
              key={tx.transactionId}
              transaction={tx}
              defaultExpanded={index === 0 && page === 1}
              onViewDetail={openDetail}
            />
          ))}
        </div>
      )}

      {totalCount > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row">
          <p className="text-sm text-slate-600">
            Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
            <span className="font-semibold text-slate-800">{Math.max(1, totalPages)}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="font-semibold text-slate-800">{totalCount}</span> total records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <TransactionDetailModal
        transaction={selected}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
