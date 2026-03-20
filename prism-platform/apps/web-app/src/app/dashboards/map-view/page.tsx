'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { IndiaMap } from '@/components/dashboard/india-map';
import { MapControlPanel, DrillBreadcrumb } from '@/components/dashboard/map-control-panel';
import type { MapFilters } from '@/components/dashboard/map-control-panel';
import { useStoreMapData } from '@/hooks/use-store-map-data';
import { useMapAnalytics } from '@/hooks/use-map-analytics';
import type { MapScope } from '@/hooks/use-map-analytics';
import type { MapDrillEvent } from '@/components/dashboard/india-map';

export default function MapViewDashboardPage() {
    const { stores, loading: storesLoading } = useStoreMapData();
    const { scopeData, employeeData, storeScores, loading: analyticsLoading, fetchScope } = useMapAnalytics();

    const [breadcrumbs, setBreadcrumbs] = useState<DrillBreadcrumb[]>([
        { label: 'All India', scope: 'all' },
    ]);

    const [filters, setFilters] = useState<MapFilters>({ region: '', am: '', trainer: '', store: '' });

    /* ── Compute filtered store IDs ── */
    const filteredStoreIds = useMemo(() => {
        const hasFilter = filters.region || filters.am || filters.trainer || filters.store;
        if (!hasFilter) return null;

        let filtered = stores;
        if (filters.region) filtered = filtered.filter(s => s.region?.name === filters.region);
        if (filters.am) filtered = filtered.filter(s => s.amName === filters.am);
        if (filters.trainer) filtered = filtered.filter(s => s.trainer1Name === filters.trainer);
        if (filters.store) filtered = filtered.filter(s => s.id === filters.store);

        return new Set(filtered.map(s => s.id));
    }, [stores, filters]);

    /* ── Filtered store count for stats ── */
    const visibleStoreCount = filteredStoreIds ? filteredStoreIds.size : stores.length;

    const handleDrill = useCallback((event: MapDrillEvent) => {
        const scopeLabels: Record<string, string> = {
            region: `Region: ${event.scopeValue}`,
            am: `AM: ${event.scopeValue}`,
            trainer: `Trainer: ${event.scopeValue}`,
            store: `Store`,
        };
        const label = scopeLabels[event.scope] || event.scopeValue || event.scope;

        setBreadcrumbs(prev => {
            const existingIdx = prev.findIndex(b => b.scope === event.scope);
            const base = existingIdx >= 0 ? prev.slice(0, existingIdx) : prev;
            return [...base, { label, scope: event.scope as MapScope, scopeValue: event.scopeValue }];
        });

        fetchScope(event.scope as MapScope, event.scopeValue);
    }, [fetchScope]);

    const handleBreadcrumbClick = useCallback((crumb: DrillBreadcrumb) => {
        setBreadcrumbs(prev => {
            const idx = prev.findIndex(b => b === crumb);
            return prev.slice(0, idx + 1);
        });
        fetchScope(crumb.scope, crumb.scopeValue);
    }, [fetchScope]);

    const handleFilterChange = useCallback((f: MapFilters) => {
        setFilters(f);
        // Also update scope based on filter selection
        if (f.store) {
            fetchScope('store', f.store);
        } else if (f.trainer) {
            fetchScope('trainer', f.trainer);
        } else if (f.am) {
            fetchScope('am', f.am);
        } else if (f.region) {
            fetchScope('region', f.region);
        } else {
            fetchScope('all');
        }
    }, [fetchScope]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left panel — 30% */}
            <div className="w-[30%] min-w-[280px] max-w-[400px] border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <MapControlPanel
                    breadcrumbs={breadcrumbs}
                    onBreadcrumbClick={handleBreadcrumbClick}
                    scopeData={scopeData}
                    employeeData={employeeData}
                    loading={analyticsLoading}
                    totalStores={visibleStoreCount}
                    stores={stores}
                    storeScores={storeScores}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </div>

            {/* Right panel — 70% map */}
            <div className="flex-1 relative">
                {storesLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                            <span className="text-xs text-[var(--text-muted)] font-mono">Loading stores…</span>
                        </div>
                    </div>
                )}
                <IndiaMap
                    stores={stores}
                    storeScores={storeScores}
                    filteredStoreIds={filteredStoreIds}
                    className="w-full h-full"
                    onDrill={handleDrill}
                />
            </div>
        </div>
    );
}
