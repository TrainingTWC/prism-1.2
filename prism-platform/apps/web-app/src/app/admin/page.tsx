'use client';

import React, { useState } from 'react';
import { PageHeader } from '@prism/ui';

type AdminTab = 'roles' | 'checklists' | 'raw-json' | 'audit-details' | 'store-health';

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
        id: 'roles',
        label: 'Roles',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
    },
    {
        id: 'checklists',
        label: 'Checklists',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
        ),
    },
    {
        id: 'raw-json',
        label: 'Raw JSON',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
        ),
    },
    {
        id: 'audit-details',
        label: 'Audit Details',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
    {
        id: 'store-health',
        label: 'Store Health',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
        ),
    },
];

const mockRoles = [
    { empId: 'EMP001', name: 'Arun Kumar', role: 'editor', email: 'arun@thirdwavecoffee.com' },
    { empId: 'EMP002', name: 'Priya Mehta', role: 'hr', email: 'priya@thirdwavecoffee.com' },
    { empId: 'EMP003', name: 'Vikram Singh', role: 'operations', email: 'vikram@thirdwavecoffee.com' },
    { empId: 'EMP004', name: 'Sneha Patel', role: 'training', email: 'sneha@thirdwavecoffee.com' },
    { empId: 'EMP005', name: 'Rohan Gupta', role: 'qa', email: 'rohan@thirdwavecoffee.com' },
    { empId: 'EMP006', name: 'Meera Joshi', role: 'finance', email: 'meera@thirdwavecoffee.com' },
];

const mockChecklistConfig = [
    { id: 'hr', name: 'HR Employee Survey', questions: 46, active: true },
    { id: 'operations', name: 'Operations Checklist', questions: 38, active: true },
    { id: 'training', name: 'Training Audit', questions: 42, active: true },
    { id: 'qa', name: 'QA Assessment', questions: 35, active: true },
    { id: 'finance', name: 'Finance Audit', questions: 28, active: true },
    { id: 'shlp', name: 'SHLP Certification', questions: 36, active: true },
];

const mockJsonConfig = `{
  "app": "prism",
  "version": "1.2",
  "modules": {
    "hr": { "enabled": true, "questions": 46 },
    "operations": { "enabled": true, "questions": 38 },
    "training": { "enabled": true, "questions": 42 },
    "qa": { "enabled": true, "questions": 35 },
    "finance": { "enabled": true, "questions": 28 },
    "shlp": { "enabled": true, "questions": 36 }
  },
  "roles": ["editor", "hr", "operations", "training", "qa", "finance"]
}`;

function RolesTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-obsidian-200">User Role Mappings</h3>
                <button className="px-4 py-2 rounded-xl bg-[#0d8c63]/10 border border-[#0d8c63]/20 text-[#0d8c63] text-xs font-bold hover:bg-[#0d8c63]/20 transition-colors">
                    + Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-obsidian-600/30">
                            <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Emp ID</th>
                            <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Name</th>
                            <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Email</th>
                            <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Role</th>
                            <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockRoles.map((user) => (
                            <tr key={user.empId} className="border-b border-obsidian-600/10 hover:bg-obsidian-800/30">
                                <td className="py-3 px-3 text-obsidian-300 font-mono text-xs">{user.empId}</td>
                                <td className="py-3 px-3 text-obsidian-200 font-medium">{user.name}</td>
                                <td className="py-3 px-3 text-obsidian-400">{user.email}</td>
                                <td className="py-3 px-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        user.role === 'editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                        user.role === 'hr' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        user.role === 'operations' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        user.role === 'training' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                        user.role === 'qa' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                    <button className="text-xs text-obsidian-400 hover:text-obsidian-200 mr-3">Edit</button>
                                    <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChecklistsTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-obsidian-200">Checklist Configuration</h3>
                <button className="px-4 py-2 rounded-xl bg-[#0d8c63]/10 border border-[#0d8c63]/20 text-[#0d8c63] text-xs font-bold hover:bg-[#0d8c63]/20 transition-colors">
                    + Add Checklist
                </button>
            </div>
            <div className="grid gap-3">
                {mockChecklistConfig.map((cl) => (
                    <div key={cl.id} className="rounded-xl border border-obsidian-600/30 bg-obsidian-800/30 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${cl.active ? 'bg-emerald-400' : 'bg-obsidian-500'}`} />
                            <div>
                                <div className="text-sm font-semibold text-obsidian-200">{cl.name}</div>
                                <div className="text-xs text-obsidian-400">{cl.questions} questions</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-3 py-1.5 rounded-lg bg-obsidian-700/50 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 transition-colors">
                                Edit Questions
                            </button>
                            <button className="px-3 py-1.5 rounded-lg bg-obsidian-700/50 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 transition-colors">
                                {cl.active ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RawJsonTab() {
    const [json, setJson] = useState(mockJsonConfig);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-obsidian-200">Raw JSON Configuration</h3>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl bg-obsidian-700/50 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 transition-colors">
                        Export .json
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-[#0d8c63]/10 border border-[#0d8c63]/20 text-[#0d8c63] text-xs font-bold hover:bg-[#0d8c63]/20 transition-colors">
                        Save Config
                    </button>
                </div>
            </div>
            <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-xl text-sm font-mono bg-obsidian-800/60 border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 outline-none resize-none"
            />
        </div>
    );
}

function AuditDetailsTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-obsidian-200">Audit Detail Configuration</h3>
            <p className="text-sm text-obsidian-400">
                Configure per-checklist audit detail views, field mappings, and export formats.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['HR', 'Operations', 'Training', 'QA', 'Finance', 'SHLP'].map((dept) => (
                    <div key={dept} className="rounded-xl border border-obsidian-600/30 bg-obsidian-800/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-obsidian-200">{dept} Audit</span>
                            <span className="text-xs text-emerald-400">Configured</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 px-3 py-1.5 rounded-lg bg-obsidian-700/50 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 text-center">
                                Edit Fields
                            </button>
                            <button className="flex-1 px-3 py-1.5 rounded-lg bg-obsidian-700/50 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 text-center">
                                Export Config
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StoreHealthTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-obsidian-200">Store Health Card Export</h3>
            <p className="text-sm text-obsidian-400">
                Configure store health card data sources and export templates.
            </p>
            <div className="rounded-xl border border-obsidian-600/30 bg-obsidian-800/30 p-5 space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-obsidian-400 mb-2 block">Data Source</label>
                    <select className="w-full px-4 py-2.5 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 outline-none">
                        <option>Google Sheets (Live Sync)</option>
                        <option>API Backend</option>
                        <option>Manual Upload</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-obsidian-400 mb-2 block">Export Format</label>
                    <select className="w-full px-4 py-2.5 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/40 text-obsidian-200 focus:ring-1 focus:ring-[#0d8c63]/20 outline-none">
                        <option>PDF Report</option>
                        <option>Excel Spreadsheet</option>
                        <option>CSV</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-obsidian-400 mb-2 block">AM Name Mapping</label>
                    <p className="text-xs text-obsidian-500 mb-2">Employee directory integration for Area Manager name resolution</p>
                    <button className="px-4 py-2 rounded-xl bg-[#0d8c63]/10 border border-[#0d8c63]/20 text-[#0d8c63] text-xs font-bold hover:bg-[#0d8c63]/20 transition-colors">
                        Sync Employee Directory
                    </button>
                </div>
            </div>
            <div className="flex gap-3">
                <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0d8c63] to-[#10b37d] text-white font-bold text-sm hover:shadow-[0_4px_24px_rgba(13,140,99,0.3)] transition-all">
                    Save Configuration
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-obsidian-700/50 border border-obsidian-600/30 text-sm text-obsidian-300 hover:text-obsidian-100 transition-colors">
                    Export Store Health Cards
                </button>
            </div>
        </div>
    );
}

const tabContent: Record<AdminTab, React.ReactNode> = {
    'roles': <RolesTab />,
    'checklists': <ChecklistsTab />,
    'raw-json': <RawJsonTab />,
    'audit-details': <AuditDetailsTab />,
    'store-health': <StoreHealthTab />,
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('roles');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <PageHeader title="Admin Configuration" subtitle="Manage roles, checklists, and system settings" />
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Editor Only
                </span>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] p-1.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-[#0d8c63]/10 text-[#0d8c63] border border-[#0d8c63]/20'
                                : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/30'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] p-6">
                {tabContent[activeTab]}
            </div>
        </div>
    );
}
