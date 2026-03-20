'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ── Types ──

interface StoreInfo {
  id: string;
  storeName: string;
  storeCode: string | null;
  regionId: string | null;
  amId: string | null;
  amName: string | null;
  hrbp1Id: string | null;
  hrbp1Name: string | null;
  trainer1Id: string | null;
  trainer1Name: string | null;
  storeFormat: string | null;
  menuType: string | null;
  priceGroup: string | null;
  region: { id: string; name: string } | null;
}

interface EmployeeInfo {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  storeId: string | null;
  store: StoreInfo | null;
}

interface Props {
  companyId: string;
  /** Currently logged-in auditor */
  auditor: { id: string; name: string; empId: string };
  onSelectionComplete: (selection: { storeId: string; employeeId: string }) => void;
  /** Initially selected store (optional) */
  initialStoreId?: string;
  /** Initially selected employee (optional) */
  initialEmployeeId?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Info row helper ──
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-obsidian-500 font-semibold w-24 shrink-0">{label}</span>
      <span className="text-xs text-obsidian-200 truncate">{value || '—'}</span>
    </div>
  );
}

export function AuditHeader({ companyId, auditor, onSelectionComplete, initialStoreId, initialEmployeeId }: Props) {
  // ── Data ──
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // ── Selection ──
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId ?? '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmployeeId ?? '');

  // ── Search ──
  const [storeSearch, setStoreSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  // ── Derived ──
  const selectedStore = useMemo(() => stores.find((s) => s.id === selectedStoreId) ?? null, [stores, selectedStoreId]);
  const selectedEmployee = useMemo(() => employees.find((e) => e.id === selectedEmployeeId) ?? null, [employees, selectedEmployeeId]);

  // ── Fetch stores ──
  useEffect(() => {
    (async () => {
      setLoadingStores(true);
      try {
        const res = await fetch(`${API}/api/stores?companyId=${companyId}&active=true`);
        const json = await res.json();
        setStores(json.data ?? []);
      } catch { /* ignore */ }
      setLoadingStores(false);
    })();
  }, [companyId]);

  // ── Fetch employees ──
  useEffect(() => {
    (async () => {
      setLoadingEmployees(true);
      try {
        const res = await fetch(`${API}/api/employees?companyId=${companyId}&active=true`);
        const json = await res.json();
        setEmployees(json.data ?? []);
      } catch { /* ignore */ }
      setLoadingEmployees(false);
    })();
  }, [companyId]);

  // ── Filter employees by region when store is selected ──
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (selectedStore?.regionId) {
      list = list.filter((e) => e.store?.regionId === selectedStore.regionId);
    }
    if (employeeSearch) {
      const q = employeeSearch.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.empId.toLowerCase().includes(q));
    }
    return list;
  }, [employees, selectedStore, employeeSearch]);

  // ── Filtered stores ──
  const filteredStores = useMemo(() => {
    if (!storeSearch) return stores;
    const q = storeSearch.toLowerCase();
    return stores.filter((s) => s.storeName.toLowerCase().includes(q) || (s.storeCode?.toLowerCase().includes(q) ?? false));
  }, [stores, storeSearch]);

  // ── Store selection handler ──
  const handleStoreSelect = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
    setStoreDropdownOpen(false);
    setStoreSearch('');
    // Don't clear employee — let user pick
  }, []);

  // ── Employee selection handler (auto-fills store) ──
  const handleEmployeeSelect = useCallback((empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    setSelectedEmployeeId(empId);
    setEmployeeDropdownOpen(false);
    setEmployeeSearch('');
    if (emp?.storeId) {
      setSelectedStoreId(emp.storeId);
    }
  }, [employees]);

  // ── Notify parent when both are selected ──
  useEffect(() => {
    if (selectedStoreId && selectedEmployeeId) {
      onSelectionComplete({ storeId: selectedStoreId, employeeId: selectedEmployeeId });
    }
  }, [selectedStoreId, selectedEmployeeId, onSelectionComplete]);

  // ── Get display info from selected store (either directly or via employee) ──
  const displayStore = selectedStore ?? selectedEmployee?.store ?? null;

  return (
    <div className="glass rounded-xl border border-obsidian-600/20 p-5 space-y-5 overflow-visible relative z-40">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-obsidian-100">Audit Information</h3>
        <span className="text-[10px] text-obsidian-500">
          Auditor: <span className="text-obsidian-300 font-semibold">{auditor.name}</span>
          <span className="text-obsidian-600 ml-1">({auditor.empId})</span>
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
        {/* ── Store Selector ── */}
        <div className={`relative ${storeDropdownOpen ? 'z-50' : 'z-10'}`}>
          <label className="block text-[10px] font-semibold text-obsidian-500 uppercase tracking-wider mb-1.5">
            Store <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => { setStoreDropdownOpen(!storeDropdownOpen); setEmployeeDropdownOpen(false); }}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selectedStore
                ? 'border-[#0d8c63]/30 bg-[rgba(13,140,99,0.05)] text-obsidian-100'
                : 'border-obsidian-600/30 bg-obsidian-800/60 text-obsidian-400'
            }`}
          >
            <span className="truncate">
              {selectedStore ? `${selectedStore.storeName} (${selectedStore.storeCode ?? ''})` : 'Select a store...'}
            </span>
            <svg className={`w-4 h-4 shrink-0 transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {storeDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-obsidian-600/30 bg-obsidian-900 shadow-2xl max-h-64 overflow-hidden">
              <div className="p-2 border-b border-obsidian-600/20">
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search stores..."
                  className="w-full rounded-lg bg-obsidian-800/60 border border-obsidian-600/30 px-3 py-2 text-xs text-obsidian-200 placeholder:text-obsidian-500 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-48">
                {loadingStores ? (
                  <p className="text-xs text-obsidian-500 text-center py-4">Loading stores...</p>
                ) : filteredStores.length === 0 ? (
                  <p className="text-xs text-obsidian-500 text-center py-4">No stores found</p>
                ) : (
                  filteredStores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStoreSelect(s.id)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-obsidian-800/40 transition-colors flex items-center justify-between ${
                        s.id === selectedStoreId ? 'bg-[rgba(13,140,99,0.08)] text-[#10b37d]' : 'text-obsidian-200'
                      }`}
                    >
                      <span className="truncate">{s.storeName}</span>
                      <span className="text-obsidian-500 shrink-0 ml-2">{s.storeCode}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Employee Selector ── */}
        <div className={`relative ${employeeDropdownOpen ? 'z-50' : 'z-10'}`}>
          <label className="block text-[10px] font-semibold text-obsidian-500 uppercase tracking-wider mb-1.5">
            Employee Being Assessed <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => { setEmployeeDropdownOpen(!employeeDropdownOpen); setStoreDropdownOpen(false); }}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selectedEmployee
                ? 'border-[#0d8c63]/30 bg-[rgba(13,140,99,0.05)] text-obsidian-100'
                : 'border-obsidian-600/30 bg-obsidian-800/60 text-obsidian-400'
            }`}
          >
            <span className="truncate">
              {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.empId})` : 'Select an employee...'}
            </span>
            <svg className={`w-4 h-4 shrink-0 transition-transform ${employeeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {employeeDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-obsidian-600/30 bg-obsidian-900 shadow-2xl max-h-64 overflow-hidden">
              <div className="p-2 border-b border-obsidian-600/20">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full rounded-lg bg-obsidian-800/60 border border-obsidian-600/30 px-3 py-2 text-xs text-obsidian-200 placeholder:text-obsidian-500 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-48">
                {loadingEmployees ? (
                  <p className="text-xs text-obsidian-500 text-center py-4">Loading employees...</p>
                ) : filteredEmployees.length === 0 ? (
                  <p className="text-xs text-obsidian-500 text-center py-4">No employees found{selectedStore ? ' in this region' : ''}</p>
                ) : (
                  filteredEmployees.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleEmployeeSelect(e.id)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-obsidian-800/40 transition-colors flex items-center justify-between ${
                        e.id === selectedEmployeeId ? 'bg-[rgba(13,140,99,0.08)] text-[#10b37d]' : 'text-obsidian-200'
                      }`}
                    >
                      <div className="truncate">
                        <span>{e.name}</span>
                        {e.designation && <span className="text-obsidian-500 ml-1">· {e.designation}</span>}
                      </div>
                      <span className="text-obsidian-500 shrink-0 ml-2">{e.empId}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Auto-filled Information ── */}
      {displayStore && (
        <div className="rounded-lg border border-obsidian-600/15 bg-obsidian-800/20 p-4">
          <p className="text-[10px] font-bold text-obsidian-500 uppercase tracking-wider mb-3">Auto-filled Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
            <InfoRow label="Region" value={displayStore.region?.name} />
            <InfoRow label="AM" value={displayStore.amName} />
            <InfoRow label="HR" value={displayStore.hrbp1Name} />
            <InfoRow label="Trainer" value={displayStore.trainer1Name} />
            <InfoRow label="Store Format" value={displayStore.storeFormat} />
            <InfoRow label="Menu Type" value={displayStore.menuType} />
            <InfoRow label="Price Group" value={displayStore.priceGroup} />
            {selectedEmployee && (
              <>
                <InfoRow label="Emp ID" value={selectedEmployee.empId} />
                <InfoRow label="Department" value={selectedEmployee.department} />
                <InfoRow label="Designation" value={selectedEmployee.designation} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Readiness indicator */}
      {(!selectedStoreId || !selectedEmployeeId) && (
        <p className="text-[11px] text-amber-400/70 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Please select both a store and an employee to begin the checklist.
        </p>
      )}
    </div>
  );
}
