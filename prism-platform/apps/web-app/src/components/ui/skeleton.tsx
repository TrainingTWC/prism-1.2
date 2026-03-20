'use client';

import React from 'react';

/* ─── Base Skeleton Pulse ─── */
function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`}
      style={style}
    />
  );
}

/* ─── Stat Card Skeleton ─── */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-3">
      <Bone className="h-3 w-20" />
      <Bone className="h-8 w-28" />
    </div>
  );
}

/* ─── Table Row Skeleton ─── */
function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.03]">
      {Array.from({ length: cols }).map((_, i) => (
        <Bone
          key={i}
          className="h-3.5"
          style={{ width: `${i === 0 ? 60 : i === 1 ? 140 : 80 + Math.random() * 40}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Table Skeleton ─── */
export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06]">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3" style={{ width: `${60 + i * 10}px` } as React.CSSProperties} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  );
}

/* ─── Search Bar Skeleton ─── */
export function SearchBarSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4">
      <Bone className="h-4 w-64" />
    </div>
  );
}

/* ─── Dashboard Grid Card Skeleton ─── */
export function DashboardCardSkeleton() {
  return (
    <div className="aspect-square rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] flex flex-col items-center justify-center gap-3 p-4">
      <Bone className="h-12 w-12 rounded-xl" />
      <Bone className="h-3.5 w-20" />
    </div>
  );
}

/* ─── Chart Panel Skeleton ─── */
export function ChartPanelSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
      <div className="space-y-1">
        <Bone className="h-4 w-40" />
        <Bone className="h-2.5 w-64" />
      </div>
      <Bone className="w-full rounded-xl" style={{ height } as React.CSSProperties} />
    </div>
  );
}

/* ─── Entity Intelligence Card Skeleton ─── */
export function EntityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-2.5 w-40" />
          </div>
        </div>
        <Bone className="h-12 w-12 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
        <Bone className="h-5 w-14 rounded-full" />
        <Bone className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

/* ─── Full Page Skeletons ─── */

/** Table-based page (stores, employees) */
export function TablePageSkeleton({ statCount = 4, cols = 6 }: { statCount?: number; cols?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-7 w-48" />
        <Bone className="h-3 w-72 mt-1" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {Array.from({ length: statCount }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Search */}
      <SearchBarSkeleton />
      {/* Table */}
      <TableSkeleton rows={12} cols={cols} />
    </div>
  );
}

/** Dashboard index page (grid of module cards) */
export function DashboardIndexSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-7 w-40" />
          <Bone className="h-3 w-72 mt-1" />
        </div>
        <Bone className="h-8 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Dashboard detail page (stats + charts) */
export function DashboardDetailSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-7 w-56" />
        <Bone className="h-3 w-80 mt-1" />
      </div>
      {/* Type selector placeholder */}
      <Bone className="h-10 w-full max-w-xl rounded-xl" />
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Charts */}
      <ChartPanelSkeleton height={60} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanelSkeleton />
        <ChartPanelSkeleton />
      </div>
    </div>
  );
}

/** Checklist/Programs index page */
export function ChecklistIndexSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-7 w-40" />
          <Bone className="h-3 w-72 mt-1" />
        </div>
        <Bone className="h-8 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Entity intelligence list page (regions, managers, stores intelligence) */
export function EntityListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-8 w-36" />
        <Bone className="h-0.5 w-16 mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <SearchBarSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <EntityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** AI Insights / Chat page skeleton */
export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-white/[0.04]">
        <Bone className="h-6 w-48" />
        <Bone className="h-3 w-72 mt-2" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3">
          <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1 max-w-md">
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-3/4" />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-white/[0.04]">
        <Bone className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Generic page skeleton */
export function GenericPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-7 w-48" />
        <Bone className="h-3 w-72 mt-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <ChartPanelSkeleton />
    </div>
  );
}
