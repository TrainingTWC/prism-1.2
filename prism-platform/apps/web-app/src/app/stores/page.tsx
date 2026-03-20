'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
    PageHeader,
    FilterBar,
    TableView,
    GlassPanel,
    StatCard,
} from '@prism/ui';

interface Store {
    id: string;
    storeName: string;
    storeCode: string | null;
    city: string;
    state: string | null;
    address: string | null;
    isActive: boolean;
    storeFormat: string | null;
    menuType: string | null;
    priceGroup: string | null;
    regionId: string | null;
    amId: string | null;
    amName: string | null;
    hrbp1Id: string | null;
    hrbp1Name: string | null;
    hrbp2Id: string | null;
    hrbp2Name: string | null;
    hrbp3Id: string | null;
    hrbp3Name: string | null;
    trainer1Id: string | null;
    trainer1Name: string | null;
    trainer2Id: string | null;
    trainer2Name: string | null;
    trainer3Id: string | null;
    trainer3Name: string | null;
    regionalTrainerId: string | null;
    regionalTrainerName: string | null;
    regionalHrId: string | null;
    regionalHrName: string | null;
    hrHeadId: string | null;
    hrHeadName: string | null;
    region: { id: string; name: string } | null;
}

interface RegionOption {
    id: string;
    name: string;
}

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const emptyForm: Record<string, string | boolean> = {
    storeName: '',
    storeCode: '',
    city: '',
    state: '',
    address: '',
    regionId: '',
    storeFormat: '',
    menuType: '',
    priceGroup: '',
    amId: '',
    amName: '',
    hrbp1Id: '',
    hrbp1Name: '',
    hrbp2Id: '',
    hrbp2Name: '',
    hrbp3Id: '',
    hrbp3Name: '',
    trainer1Id: '',
    trainer1Name: '',
    trainer2Id: '',
    trainer2Name: '',
    trainer3Id: '',
    trainer3Name: '',
    regionalTrainerId: '',
    regionalTrainerName: '',
    regionalHrId: '',
    regionalHrName: '',
    hrHeadId: '',
    hrHeadName: '',
    isActive: true,
};

export default function StoresPage() {
    const router = useRouter();
    const { canEdit } = useAuth();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [regions, setRegions] = useState<RegionOption[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');
    const [activeTab, setActiveTab] = useState<'basic' | 'mapping'>('basic');

    const loadStores = useCallback(() => {
        setLoading(true);
        apiClient<{ data: Store[] }>('/api/stores')
            .then((res) => {
                setStores(res.data);
                // Extract unique regions
                const regs = res.data
                    .filter((s) => s.region)
                    .map((s) => s.region!)
                    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);
                setRegions(regs);
            })
            .catch((err) => console.error('Failed to load stores:', err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadStores();
    }, [loadStores]);

    const filtered = stores.filter((s) => {
        const q = search.toLowerCase();
        return (
            s.storeName.toLowerCase().includes(q) ||
            (s.storeCode || '').toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            (s.state || '').toLowerCase().includes(q) ||
            (s.region?.name || '').toLowerCase().includes(q) ||
            (s.amName || '').toLowerCase().includes(q)
        );
    });

    const regionNames = [...new Set(stores.map((s) => s.region?.name).filter(Boolean))];
    const activeCount = stores.filter((s) => s.isActive).length;

    const openAddModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setActiveTab('basic');
        setModalError('');
        setShowModal(true);
    };

    const openEditModal = (store: Store) => {
        setEditingId(store.id);
        const f: Record<string, string | boolean> = {};
        for (const key of Object.keys(emptyForm)) {
            if (key === 'isActive') {
                f[key] = store.isActive;
            } else {
                f[key] = (store as any)[key] ?? '';
            }
        }
        // region from nested object
        f.regionId = store.regionId || '';
        setForm(f);
        setActiveTab('basic');
        setModalError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.storeName || !form.city) {
            setModalError('Store Name and City are required');
            return;
        }
        setSaving(true);
        setModalError('');
        try {
            const payload: Record<string, any> = {};
            for (const [key, val] of Object.entries(form)) {
                if (key === 'isActive') {
                    payload[key] = val;
                } else {
                    payload[key] = val === '' ? null : val;
                }
            }

            if (editingId) {
                await apiClient(`/api/stores/${editingId}`, { method: 'PUT', body: payload });
            } else {
                await apiClient('/api/stores', { method: 'POST', body: { ...payload, companyId: COMPANY_ID } });
            }
            setShowModal(false);
            loadStores();
        } catch (err: any) {
            setModalError(err?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const setField = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

    const columns = [
        { header: 'Store Code', accessor: ((row: Store) => row.storeCode || '—') as unknown as keyof Store, mono: true },
        {
            header: 'Store Name',
            accessor: ((row: Store) => (
                <Link href={`/stores/${row.id}`} className="text-[var(--text-primary)] hover:text-[#10b37d] transition-colors font-medium">
                    {row.storeName}
                </Link>
            )) as unknown as keyof Store,
        },
        { header: 'City', accessor: 'city' as const },
        { header: 'State', accessor: ((row: Store) => row.state || '—') as unknown as keyof Store },
        { header: 'Region', accessor: ((row: Store) => row.region?.name || '—') as unknown as keyof Store },
        { header: 'Format', accessor: ((row: Store) => row.storeFormat || '—') as unknown as keyof Store },
        { header: 'AM', accessor: ((row: Store) => row.amName || '—') as unknown as keyof Store },
        {
            header: 'Status',
            accessor: ((row: Store) => (
                <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                        color: row.isActive ? '#10b37d' : '#EF4444',
                        background: row.isActive ? 'rgba(16,179,125,0.08)' : 'rgba(239,68,68,0.08)',
                    }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.isActive ? '#10b37d' : '#EF4444' }} />
                    {row.isActive ? 'Active' : 'Inactive'}
                </span>
            )) as unknown as keyof Store,
        },
        ...(canEdit
            ? [
                  {
                      header: 'Actions',
                      accessor: ((row: Store) => (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                  onClick={() => openEditModal(row)}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-[#10b37d]/10 text-[#10b37d] hover:bg-[#10b37d]/20 transition-colors font-medium"
                              >
                                  Edit
                              </button>
                          </div>
                      )) as unknown as keyof Store,
                  },
              ]
            : []),
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                overline="Store Master"
                title="Store Directory"
                subtitle={`Manage and view all store locations across ${regionNames.length} regions`}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard title="Total Stores" value={loading ? '...' : stores.length.toLocaleString()} />
                <StatCard title="Active" value={loading ? '...' : activeCount.toLocaleString()} />
                <StatCard title="Regions" value={loading ? '...' : regionNames.length} />
                <StatCard title="Cities" value={loading ? '...' : new Set(stores.map((s) => s.city)).size} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 w-full">
                    <FilterBar
                        onSearch={setSearch}
                        placeholder="Search by store name, code, city, state, region, or AM..."
                    />
                </div>
                {canEdit && (
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#10b37d] text-white hover:bg-[#0d8c63] transition-colors shrink-0"
                    >
                        + Add Store
                    </button>
                )}
            </div>

            <GlassPanel className="overflow-hidden" padding="none">
                <TableView
                    data={filtered}
                    columns={columns}
                    isLoading={loading}
                    onRowClick={(row) => {
                        router.push(`/stores/${row.id}`);
                    }}
                />
            </GlassPanel>

            {!loading && (
                <p className="text-xs text-[var(--text-muted)] text-center">
                    Showing {filtered.length} of {stores.length} stores
                </p>
            )}

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                {editingId ? 'Edit Store' : 'Add Store'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-6 pt-4">
                            {(['basic', 'mapping'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                                        activeTab === tab
                                            ? 'bg-[#10b37d]/15 text-[#10b37d]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {tab === 'basic' ? 'Store Details' : 'Store Mapping'}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 space-y-4">
                            {modalError && (
                                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{modalError}</div>
                            )}

                            {activeTab === 'basic' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <SFieldInput label="Store Name *" value={form.storeName as string} onChange={(v) => setField('storeName', v)} placeholder="Store name" />
                                    <SFieldInput label="Store Code" value={form.storeCode as string} onChange={(v) => setField('storeCode', v)} placeholder="STORE-001" />
                                    <SFieldInput label="City *" value={form.city as string} onChange={(v) => setField('city', v)} placeholder="Mumbai" />
                                    <SFieldInput label="State" value={form.state as string} onChange={(v) => setField('state', v)} placeholder="Maharashtra" />
                                    <div className="sm:col-span-2">
                                        <SFieldInput label="Address" value={form.address as string} onChange={(v) => setField('address', v)} placeholder="Full address" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Region</label>
                                        <select
                                            value={form.regionId as string}
                                            onChange={(e) => setField('regionId', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#10b37d]"
                                        >
                                            <option value="">— No region —</option>
                                            {regions.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <SFieldInput label="Store Format" value={form.storeFormat as string} onChange={(v) => setField('storeFormat', v)} placeholder="Kiosk, Dine-in..." />
                                    <SFieldInput label="Menu Type" value={form.menuType as string} onChange={(v) => setField('menuType', v)} placeholder="Full, Limited..." />
                                    <SFieldInput label="Price Group" value={form.priceGroup as string} onChange={(v) => setField('priceGroup', v)} placeholder="A, B, C..." />
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Active</label>
                                        <select
                                            value={form.isActive ? 'true' : 'false'}
                                            onChange={(e) => setField('isActive', e.target.value === 'true')}
                                            className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#10b37d]"
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mapping' && (
                                <div className="space-y-6">
                                    {/* Area Manager */}
                                    <MappingSection title="Area Manager">
                                        <SFieldInput label="AM ID" value={form.amId as string} onChange={(v) => setField('amId', v)} placeholder="H001" />
                                        <SFieldInput label="AM Name" value={form.amName as string} onChange={(v) => setField('amName', v)} placeholder="Full name" />
                                    </MappingSection>

                                    {/* HRBPs */}
                                    <MappingSection title="HR Business Partners">
                                        <SFieldInput label="HRBP 1 ID" value={form.hrbp1Id as string} onChange={(v) => setField('hrbp1Id', v)} placeholder="H001" />
                                        <SFieldInput label="HRBP 1 Name" value={form.hrbp1Name as string} onChange={(v) => setField('hrbp1Name', v)} placeholder="Full name" />
                                        <SFieldInput label="HRBP 2 ID" value={form.hrbp2Id as string} onChange={(v) => setField('hrbp2Id', v)} placeholder="H002" />
                                        <SFieldInput label="HRBP 2 Name" value={form.hrbp2Name as string} onChange={(v) => setField('hrbp2Name', v)} placeholder="Full name" />
                                        <SFieldInput label="HRBP 3 ID" value={form.hrbp3Id as string} onChange={(v) => setField('hrbp3Id', v)} placeholder="H003" />
                                        <SFieldInput label="HRBP 3 Name" value={form.hrbp3Name as string} onChange={(v) => setField('hrbp3Name', v)} placeholder="Full name" />
                                    </MappingSection>

                                    {/* Trainers */}
                                    <MappingSection title="Trainers">
                                        <SFieldInput label="Trainer 1 ID" value={form.trainer1Id as string} onChange={(v) => setField('trainer1Id', v)} placeholder="H001" />
                                        <SFieldInput label="Trainer 1 Name" value={form.trainer1Name as string} onChange={(v) => setField('trainer1Name', v)} placeholder="Full name" />
                                        <SFieldInput label="Trainer 2 ID" value={form.trainer2Id as string} onChange={(v) => setField('trainer2Id', v)} placeholder="H002" />
                                        <SFieldInput label="Trainer 2 Name" value={form.trainer2Name as string} onChange={(v) => setField('trainer2Name', v)} placeholder="Full name" />
                                        <SFieldInput label="Trainer 3 ID" value={form.trainer3Id as string} onChange={(v) => setField('trainer3Id', v)} placeholder="H003" />
                                        <SFieldInput label="Trainer 3 Name" value={form.trainer3Name as string} onChange={(v) => setField('trainer3Name', v)} placeholder="Full name" />
                                    </MappingSection>

                                    {/* Regional */}
                                    <MappingSection title="Regional Team">
                                        <SFieldInput label="Regional Trainer ID" value={form.regionalTrainerId as string} onChange={(v) => setField('regionalTrainerId', v)} placeholder="H001" />
                                        <SFieldInput label="Regional Trainer Name" value={form.regionalTrainerName as string} onChange={(v) => setField('regionalTrainerName', v)} placeholder="Full name" />
                                        <SFieldInput label="Regional HR ID" value={form.regionalHrId as string} onChange={(v) => setField('regionalHrId', v)} placeholder="H001" />
                                        <SFieldInput label="Regional HR Name" value={form.regionalHrName as string} onChange={(v) => setField('regionalHrName', v)} placeholder="Full name" />
                                        <SFieldInput label="HR Head ID" value={form.hrHeadId as string} onChange={(v) => setField('hrHeadId', v)} placeholder="H001" />
                                        <SFieldInput label="HR Head Name" value={form.hrHeadName as string} onChange={(v) => setField('hrHeadName', v)} placeholder="Full name" />
                                    </MappingSection>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--card-bg)]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--input-bg)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-bold rounded-xl bg-[#10b37d] text-white hover:bg-[#0d8c63] disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Mapping section wrapper ── */
function MappingSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
        </div>
    );
}

/* ── Reusable field input ── */
function SFieldInput({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#10b37d] transition-colors"
            />
        </div>
    );
}