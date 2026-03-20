'use client';

import React, { useState } from 'react';
import { cn } from '@prism/ui';

interface FilterOption {
    label: string;
    value: string;
}

interface DashboardFiltersProps {
    regions?: FilterOption[];
    stores?: FilterOption[];
    managers?: FilterOption[];
    extraFilters?: { label: string; key: string; options: FilterOption[] }[];
    onFilterChange?: (filters: Record<string, string>) => void;
    onDownloadPDF?: () => void;
    onDownloadExcel?: () => void;
    className?: string;
}

export function DashboardFilters({ 
    regions = defaultRegions, 
    stores = defaultStores, 
    managers = defaultManagers,
    extraFilters = [],
    onFilterChange,
    onDownloadPDF,
    onDownloadExcel,
    className 
}: DashboardFiltersProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});

    const handleChange = (key: string, value: string) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);
        onFilterChange?.(updated);
    };

    const handleReset = () => {
        setFilters({});
        onFilterChange?.({});
    };

    return (
        <div className={cn(
            "flex flex-wrap items-center gap-3 p-4 rounded-2xl",
            "bg-[var(--card-bg)] border border-obsidian-600/30 backdrop-blur-xl",
            className
        )}>
            {/* Region Filter */}
            <FilterSelect
                label="Region"
                value={filters.region || ''}
                options={regions}
                onChange={(v) => handleChange('region', v)}
            />

            {/* Store Filter */}
            <FilterSelect
                label="Store"
                value={filters.store || ''}
                options={stores}
                onChange={(v) => handleChange('store', v)}
            />

            {/* AM Filter */}
            <FilterSelect
                label="Area Manager"
                value={filters.manager || ''}
                options={managers}
                onChange={(v) => handleChange('manager', v)}
            />

            {/* Extra Filters */}
            {extraFilters.map((filter) => (
                <FilterSelect
                    key={filter.key}
                    label={filter.label}
                    value={filters[filter.key] || ''}
                    options={filter.options}
                    onChange={(v) => handleChange(filter.key, v)}
                />
            ))}

            {/* Date Range */}
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 focus:border-[#0d8c63]/40 outline-none transition-all duration-normal"
                    placeholder="From"
                />
                <span className="text-obsidian-500 text-xs">to</span>
                <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 focus:border-[#0d8c63]/40 outline-none transition-all duration-normal"
                    placeholder="To"
                />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onDownloadPDF}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-obsidian-700/50 text-obsidian-300 hover:bg-obsidian-700 hover:text-obsidian-100 border border-obsidian-600/30 transition-all duration-fast"
                >
                    <svg className="w-3.5 h-3.5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                </button>
                <button
                    onClick={onDownloadExcel}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-obsidian-700/50 text-obsidian-300 hover:bg-obsidian-700 hover:text-obsidian-100 border border-obsidian-600/30 transition-all duration-fast"
                >
                    <svg className="w-3.5 h-3.5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                </button>
                <button
                    onClick={handleReset}
                    className="px-3 py-2 text-xs font-semibold rounded-xl text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/30 transition-all duration-fast"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

function FilterSelect({ 
    label, 
    value, 
    options, 
    onChange 
}: { 
    label: string; 
    value: string; 
    options: FilterOption[]; 
    onChange: (value: string) => void 
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 focus:border-[#0d8c63]/40 outline-none transition-all duration-normal appearance-none cursor-pointer min-w-[120px]"
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

// Default mock data
const defaultRegions: FilterOption[] = [
    { label: 'North', value: 'north' },
    { label: 'South', value: 'south' },
    { label: 'East', value: 'east' },
    { label: 'West', value: 'west' },
    { label: 'Central', value: 'central' },
];

const defaultStores: FilterOption[] = [
    { label: 'Store #001 - Koramangala', value: '001' },
    { label: 'Store #002 - Indiranagar', value: '002' },
    { label: 'Store #003 - HSR Layout', value: '003' },
    { label: 'Store #004 - Whitefield', value: '004' },
    { label: 'Store #005 - JP Nagar', value: '005' },
];

const defaultManagers: FilterOption[] = [
    { label: 'Priya Sharma', value: 'priya' },
    { label: 'Rahul Menon', value: 'rahul' },
    { label: 'Anita Desai', value: 'anita' },
    { label: 'Vikram Singh', value: 'vikram' },
];
