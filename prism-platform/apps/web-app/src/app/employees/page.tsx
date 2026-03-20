'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { isOperationalEmployee } from '@prism/auth';
import { PageHeader, FilterBar, GlassPanel, TableView, StatCard } from '@prism/ui';

interface Employee {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  isActive: boolean;
  storeId: string | null;
  dateOfJoining: string | null;
  category: string | null;
  location: string | null;
  store: {
    id: string;
    storeName: string;
    storeCode: string | null;
    region: { id: string; name: string } | null;
  } | null;
  role?: { id: string; name: string } | null;
}

interface StoreOption {
  id: string;
  storeName: string;
  storeCode: string | null;
}

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const emptyForm = {
  empId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  storeId: '',
  roleId: '',
  dateOfJoining: '',
  category: '',
  location: '',
  isActive: true,
};

export default function EmployeesListPage() {
  const [search, setSearch] = useState('');
  const [filterOps, setFilterOps] = useState(false);
  const router = useRouter();
  const { canEdit } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreOption[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadEmployees = useCallback(() => {
    setLoading(true);
    apiClient<{ data: Employee[] }>('/api/employees')
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error('Failed to load employees:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEmployees();
    apiClient<{ data: StoreOption[] }>('/api/stores')
      .then((res) => setStores(res.data))
      .catch(() => {});
  }, [loadEmployees]);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.name.toLowerCase().includes(q) ||
      e.empId.toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q) ||
      (e.designation || '').toLowerCase().includes(q) ||
      (e.store?.storeName || '').toLowerCase().includes(q);
    if (filterOps) return matchSearch && isOperationalEmployee(e.empId);
    return matchSearch;
  });

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const activeCount = employees.filter((e) => e.isActive).length;
  const opsCount = employees.filter((e) => isOperationalEmployee(e.empId)).length;
  const storesWithEmployees = new Set(employees.map((e) => e.storeId).filter(Boolean)).size;

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      empId: emp.empId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      storeId: emp.storeId || '',
      roleId: emp.role?.id || '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : '',
      category: emp.category || '',
      location: emp.location || '',
      isActive: emp.isActive,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.empId || !form.name || !form.email) {
      setModalError('Emp ID, Name, and Email are required');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      if (editingId) {
        await apiClient(`/api/employees/${editingId}`, {
          method: 'PUT',
          body: { ...form, storeId: form.storeId || null, roleId: form.roleId || undefined },
        });
      } else {
        await apiClient('/api/employees', {
          method: 'POST',
          body: { ...form, companyId: COMPANY_ID, storeId: form.storeId || null },
        });
      }
      setShowModal(false);
      loadEmployees();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Deactivate ${emp.name} (${emp.empId})?`)) return;
    try {
      await apiClient(`/api/employees/${emp.id}`, { method: 'DELETE' });
      loadEmployees();
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate employee');
    }
  };

  const columns = [
    { header: 'Emp ID', accessor: 'empId' as const, mono: true },
    {
      header: 'Name',
      accessor: ((row: Employee) => (
        <Link href={`/employees/${row.id}`} className="text-[var(--text-primary)] hover:text-[#10b37d] transition-colors font-medium">
          {row.name}
        </Link>
      )) as unknown as keyof Employee,
    },
    { header: 'Department', accessor: ((row: Employee) => row.department || '—') as unknown as keyof Employee },
    { header: 'Designation', accessor: ((row: Employee) => row.designation || '—') as unknown as keyof Employee },
    { header: 'Store', accessor: ((row: Employee) => row.store?.storeName || '—') as unknown as keyof Employee },
    { header: 'Region', accessor: ((row: Employee) => row.store?.region?.name || '—') as unknown as keyof Employee },
    {
      header: 'Status',
      accessor: ((row: Employee) => (
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
      )) as unknown as keyof Employee,
    },
    ...(canEdit
      ? [
          {
            header: 'Actions',
            accessor: ((row: Employee) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(row)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#10b37d]/10 text-[#10b37d] hover:bg-[#10b37d]/20 transition-colors font-medium"
                >
                  Edit
                </button>
                {row.isActive && (
                  <button
                    onClick={() => handleDelete(row)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            )) as unknown as keyof Employee,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Emp Master"
        title="Employee Directory"
        subtitle={`Manage and view all employees across ${storesWithEmployees} stores`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard title="Total Employees" value={loading ? '...' : employees.length.toLocaleString()} />
        <StatCard title="Active" value={loading ? '...' : activeCount.toLocaleString()} />
        <StatCard title="Operational" value={loading ? '...' : opsCount.toLocaleString()} />
        <StatCard title="Departments" value={loading ? '...' : departments.length} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full">
          <FilterBar
            onSearch={setSearch}
            placeholder="Search by name, emp ID, department, designation, or store..."
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setFilterOps(!filterOps)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              filterOps
                ? 'bg-[#10b37d]/15 text-[#10b37d] border-[#10b37d]/30'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]'
            }`}
          >
            {filterOps ? '✓ Operational Only' : 'Show All'}
          </button>
          {canEdit && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#10b37d] text-white hover:bg-[#0d8c63] transition-colors"
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      <GlassPanel className="overflow-hidden" padding="none">
        <TableView
          data={filtered}
          columns={columns}
          isLoading={loading}
          onRowClick={(row) => {
            router.push(`/employees/${row.id}`);
          }}
        />
      </GlassPanel>

      {!loading && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          Showing {filtered.length} of {employees.length} employees
          {filterOps && ` (operational codes only)`}
        </p>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{modalError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInput label="Emp ID *" value={form.empId} onChange={(v) => setForm({ ...form, empId: v })} placeholder="H541" disabled={!!editingId} />
                <FieldInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
                <FieldInput label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@example.com" type="email" />
                <FieldInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91..." />
                <FieldInput label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} placeholder="Operations, Training..." />
                <FieldInput label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} placeholder="Trainer, HRBP..." />
                <FieldInput label="Date of Joining" value={form.dateOfJoining} onChange={(v) => setForm({ ...form, dateOfJoining: v })} type="date" />
                <FieldInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Category" />
                <FieldInput label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Location" />

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Store</label>
                  <select
                    value={form.storeId}
                    onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#10b37d]"
                  >
                    <option value="">— No store —</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName} {s.storeCode ? `(${s.storeCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Active</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#10b37d]"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
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

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#10b37d] disabled:opacity-50 transition-colors"
      />
    </div>
  );
}
