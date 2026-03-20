'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, LayoutGroup } from 'framer-motion';
import { PageHeader } from '@prism/ui';
import { ViewToggle } from '@/components/dashboard/dashboard-type-selector';

const MotionLink = motion.create(Link);
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.5 };
import { fetchActivePrograms } from '@/lib/submission-api';
import { listAllPrograms, createProgram, deleteProgram } from '@/lib/programs-api';
import type { ProgramListItem } from '@/lib/submission-api';
import type { AdminProgramListItem } from '@/lib/programs-api';
import { useAuth } from '@/lib/auth-context';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// SVG icon paths keyed by type
const TYPE_ICON_PATHS: Record<string, string> = {
    QA_AUDIT:              'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    TRAINING_ASSESSMENT:   'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    CAMPUS_HIRING:         'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    COMPLIANCE_INSPECTION: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    OPERATIONAL_SURVEY:    'M11.42 15.17l-5.658-3.266a.747.747 0 01-.007-1.298l5.658-3.266a.75.75 0 01.75 0l5.658 3.266a.747.747 0 01.007 1.298l-5.658 3.266a.75.75 0 01-.75 0zM4.462 19.462l5.659-3.266a.75.75 0 01.75 0l5.659 3.266a.747.747 0 010 1.296l-5.659 3.265a.75.75 0 01-.75 0l-5.659-3.265a.747.747 0 010-1.296z',
    COMPETITION_SCORING:   'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-3.77 1.522m0 0-1.5 1.5m1.5-1.5-1.5-1.5',
    CUSTOM:                'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
};

const TYPE_COLORS: Record<string, string> = {
    QA_AUDIT:              '#10b37d',
    TRAINING_ASSESSMENT:   '#A855F7',
    CAMPUS_HIRING:         '#A855F7',
    COMPLIANCE_INSPECTION: '#22C55E',
    OPERATIONAL_SURVEY:    '#22C55E',
    COMPETITION_SCORING:   '#EAB308',
    CUSTOM:                '#3B82F6',
};

const TYPE_LABELS: Record<string, string> = {
    QA_AUDIT: 'QA Audit',
    TRAINING_ASSESSMENT: 'Training',
    CAMPUS_HIRING: 'Campus Hiring',
    COMPLIANCE_INSPECTION: 'Compliance',
    OPERATIONAL_SURVEY: 'Operational',
    COMPETITION_SCORING: 'Competition',
    CUSTOM: 'Custom',
};


// ── Folder configuration ──────────────────────────────────────
// Each folder defines a match function; programs are matched in order, first match wins.
// SVG paths for folder icons
const FOLDER_ICON_PATHS: Record<string, string> = {
    'brew-league':    'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-3.77 1.522m0 0-1.5 1.5m1.5-1.5-1.5-1.5',
    'bench-planning': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    'qa':             'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'operations':     'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    'training':       'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    'hr':             'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    'finance':        'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    'compliance':     'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    'other':          'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776',
};

const FOLDER_CONFIG: { key: string; label: string; color: string; match: (p: { name: string; type: string; department?: string | null }) => boolean }[] = [
    { key: 'brew-league',    label: 'Brew League',        color: '#EAB308', match: (p) => /brew\s*league|barista\s*champ/i.test(p.name) },
    { key: 'bench-planning', label: 'Bench Planning',     color: '#8B5CF6', match: (p) => /bench\s*plan/i.test(p.name) },
    { key: 'qa',             label: 'Quality Assurance',  color: '#10b37d', match: (p) => p.type === 'QA_AUDIT' || /qa\s*audit/i.test(p.name) },
    { key: 'operations',     label: 'Operations',         color: '#22C55E', match: (p) => /operations?\s*audit/i.test(p.name) || (p.type === 'OPERATIONAL_SURVEY' && !/qa/i.test(p.name)) },
    { key: 'training',       label: 'Training',           color: '#A855F7', match: (p) => /training|shlp|management\s*trainee|mt\s*feedback/i.test(p.name) },
    { key: 'hr',             label: 'HR',                 color: '#3B82F6', match: (p) => p.department === 'HR' || /hr\s*connect|campus\s*hir/i.test(p.name) },
    { key: 'finance',        label: 'Finance',            color: '#10B981', match: (p) => /finance/i.test(p.name) || p.department === 'Finance' },
    { key: 'compliance',     label: 'Compliance',         color: '#14B8A6', match: (p) => p.type === 'COMPLIANCE_INSPECTION' || /compliance/i.test(p.name) },
];

type UnifiedItem = {
    id: string; name: string; description: string | null; type: string;
    department: string | null; status: string; version: number;
    scoringEnabled: boolean; offlineEnabled: boolean; imageUploadEnabled: boolean;
    geoLocationEnabled: boolean; signatureEnabled: boolean;
    _count?: { sections?: number; submissions?: number };
};

function classifyIntoFolders(items: UnifiedItem[]) {
    const folders: { config: typeof FOLDER_CONFIG[number]; programs: UnifiedItem[] }[] =
        FOLDER_CONFIG.map((cfg) => ({ config: cfg, programs: [] }));
    const uncategorized: UnifiedItem[] = [];

    for (const item of items) {
        let matched = false;
        for (const folder of folders) {
            if (folder.config.match(item)) { folder.programs.push(item); matched = true; break; }
        }
        if (!matched) uncategorized.push(item);
    }

    // Only include folders that have programs; add "Other" if needed
    const result = folders.filter((f) => f.programs.length > 0);
    if (uncategorized.length > 0) {
        result.push({ config: { key: 'other', label: 'Other', color: '#6366F1', match: () => false }, programs: uncategorized });
    }
    return result;
}

// ── Chevron icon ──────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
             className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function ChecklistsPage() {
    const { canEdit } = useAuth();
    const router = useRouter();

    const [programs, setPrograms] = useState<ProgramListItem[]>([]);
    const [adminPrograms, setAdminPrograms] = useState<AdminProgramListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [view, setView] = useState<'grid' | 'list'>('list');

    // Folder collapse state — all open by default
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const toggleFolder = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

    // Create program modal
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('QA_AUDIT');
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (canEdit) {
                const res = await listAllPrograms({ companyId: COMPANY_ID, limit: 100 });
                setAdminPrograms(res.data ?? []);
            } else {
                const res = await fetchActivePrograms(COMPANY_ID);
                setPrograms(res.items);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load checklists');
        } finally {
            setLoading(false);
        }
    }, [canEdit]);

    useEffect(() => { load(); }, [load]);

    // Unified list
    const allItems: UnifiedItem[] = canEdit
        ? adminPrograms.map((p) => ({
            id: p.id, name: p.name, description: p.description ?? null, type: p.type,
            department: p.department ?? null, status: p.status, version: p.version,
            scoringEnabled: p.scoringEnabled, offlineEnabled: p.offlineEnabled,
            imageUploadEnabled: p.imageUploadEnabled, geoLocationEnabled: p.geoLocationEnabled,
            signatureEnabled: p.signatureEnabled,
            _count: { sections: p.sections?.length ?? 0, submissions: p._count?.submissions ?? 0 },
        }))
        : programs;

    const availableTypes = Array.from(new Set(allItems.map((p) => p.type)));

    const filtered = allItems.filter((p) => {
        if (filterType !== 'ALL' && p.type !== filterType) return false;
        if (canEdit && filterStatus !== 'ALL' && p.status !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || (p.department?.toLowerCase().includes(q) ?? false);
        }
        return true;
    });

    const folders = useMemo(() => classifyIntoFolders(filtered), [filtered]);

    async function handleCreate() {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const prog = await createProgram({ companyId: COMPANY_ID, name: newName.trim(), type: newType as 'QA_AUDIT' });
            setShowCreate(false);
            setNewName('');
            router.push(`/checklists/builder/${prog.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create program');
        } finally {
            setCreating(false);
        }
    }



    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteProgram(id);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        }
    }

    // ── Morphing program item (renders as grid card OR list row) ──
    function ProgramItem({ prog }: { prog: UnifiedItem }) {
        const color = TYPE_COLORS[prog.type] ?? '#6366F1';
        const iconPath = TYPE_ICON_PATHS[prog.type] ?? TYPE_ICON_PATHS.CUSTOM;
        const typeLabel = TYPE_LABELS[prog.type] ?? prog.type;
        const isActive = prog.status === 'ACTIVE';
        const sections = prog._count?.sections ?? 0;
        const submissions = prog._count?.submissions ?? 0;
        const isGrid = view === 'grid';

        return (
            <MotionLink
                layout
                layoutId={`prog-${prog.id}`}
                href={canEdit ? `/checklists/builder/${prog.id}` : `/execute/${prog.id}`}
                className={
                    isGrid
                        ? "group relative aspect-square flex flex-col items-center justify-center p-4 border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:shadow-lg hover:border-[var(--border-primary)] hover:bg-[var(--card-bg-hover)]"
                        : "group relative flex items-center gap-3 border border-[var(--border-subtle)] bg-[var(--card-bg)] px-4 py-3 hover:border-[var(--border-primary)] hover:bg-[var(--card-bg-hover)] hover:shadow-md"
                }
                style={{ borderRadius: isGrid ? 16 : 12 }}
                transition={{ layout: SPRING }}
            >
                {/* Type badge — always in DOM, animated */}
                <motion.span
                    animate={{
                        opacity: isGrid ? 1 : 0,
                        scale: isGrid ? 1 : 0.6,
                    }}
                    transition={SPRING}
                    className="absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border pointer-events-none"
                    style={{ backgroundColor: `${color}12`, color, borderColor: `${color}25` }}
                >
                    {typeLabel}
                </motion.span>

                {/* Icon — animate size smoothly */}
                <motion.div
                    layout="position"
                    className="flex items-center justify-center flex-shrink-0"
                    animate={{
                        width: isGrid ? 48 : 36,
                        height: isGrid ? 48 : 36,
                        borderRadius: isGrid ? 12 : 8,
                        marginBottom: isGrid ? 12 : 0,
                    }}
                    style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                    transition={SPRING}
                >
                    <svg style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" width={isGrid ? 22 : 18} height={isGrid ? 22 : 18}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                </motion.div>

                {/* Title + meta */}
                <motion.div
                    layout="position"
                    className={isGrid ? "flex flex-col items-center" : "flex-1 min-w-0"}
                    transition={SPRING}
                >
                    <h3 className={
                        isGrid
                            ? "text-[13px] font-bold text-obsidian-200 group-hover:text-obsidian-50 transition-colors text-center line-clamp-2 leading-tight px-1"
                            : "text-sm font-semibold text-obsidian-200 group-hover:text-obsidian-50 transition-colors truncate"
                    }>
                        {prog.name}
                    </h3>
                    {isGrid && (sections > 0 || submissions > 0) && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-obsidian-500">
                            {sections > 0 && <span>{sections} sec</span>}
                            {submissions > 0 && <span>{submissions} sub</span>}
                        </div>
                    )}
                </motion.div>

                {/* List arrow — always in DOM, shrink to 0 width when grid */}
                <motion.svg
                    animate={{
                        opacity: (!isGrid && isActive) ? 1 : 0,
                        width: (!isGrid && isActive) ? 16 : 0,
                    }}
                    transition={SPRING}
                    className="h-4 text-obsidian-500 group-hover:text-obsidian-300 flex-shrink-0 overflow-hidden"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </motion.svg>

                {/* Admin actions */}
                {canEdit && (
                    <div
                        className={
                            isGrid
                                ? "absolute bottom-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                : "flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        }
                        onClick={(e) => e.preventDefault()}
                    >
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); router.push(`/checklists/builder/${prog.id}`); }} className="p-1.5 rounded-lg text-obsidian-500 hover:text-[#10b37d] hover:bg-[#0d8c63]/10 transition-all" title="Edit">
                            <svg width={isGrid ? 12 : 14} height={isGrid ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(prog.id, prog.name)} className="p-1.5 rounded-lg text-obsidian-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                            <svg width={isGrid ? 12 : 14} height={isGrid ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                )}
            </MotionLink>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <PageHeader
                    overline="Checklists & Surveys"
                    title={canEdit ? 'Program Management' : 'Active Checklists'}
                    subtitle={canEdit ? 'Create, edit and manage all checklist programs.' : 'Select a checklist to begin. Progress is saved automatically.'}
                />
                {canEdit && (
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#0d8c63] hover:bg-[#0d9e6f] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0d8c63]/20 transition-all hover:scale-[1.02] flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        New Program
                    </button>
                )}
            </div>

            {/* Search + View Toggle */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input type="text" placeholder="Search checklists..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[#0d8c63]/20 transition-all" />
                    </div>

                    {canEdit && (
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'].map((s) => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-[rgba(13,140,99,0.15)] text-[#10b37d] border border-[#0d8c63]/30' : 'text-obsidian-400 hover:text-obsidian-200 border border-transparent'}`}
                                >{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
                            ))}
                        </div>
                    )}

                    <div className="ml-auto">
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                </div>

                {availableTypes.length > 1 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => setFilterType('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === 'ALL' ? 'bg-[rgba(13,140,99,0.15)] text-[#10b37d] border border-[#0d8c63]/30' : 'text-obsidian-400 hover:text-obsidian-200 border border-transparent'}`}
                        >All Types</button>
                        {availableTypes.map((t) => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === t ? 'bg-[rgba(13,140,99,0.15)] text-[#10b37d] border border-[#0d8c63]/30' : 'text-obsidian-400 hover:text-obsidian-200 border border-transparent'}`}
                            >{TYPE_LABELS[t] ?? t}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="glass rounded-xl border border-red-500/20 p-4 flex items-center justify-between">
                    <p className="text-sm text-red-400">{error}</p>
                    <button onClick={() => { setError(null); load(); }} className="text-xs text-red-400/60 underline">Retry</button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 animate-pulse">
                            <div className="h-5 w-40 rounded bg-[var(--border-primary)] mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(2)].map((__, j) => (
                                    <div key={j} className="rounded-xl bg-[var(--card-bg-hover)] p-4 h-36" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card-bg)]">
                        <svg className="h-7 w-7 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-obsidian-300">No checklists found</p>
                        <p className="text-xs text-obsidian-500 mt-1">{search ? 'Try a different search term' : canEdit ? 'Create your first program to get started' : 'No active checklists are available yet'}</p>
                    </div>
                    {canEdit && (
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-[#0d8c63]/10 text-[#10b37d] border border-[#0d8c63]/20 text-xs font-bold hover:bg-[#0d8c63]/20 transition-colors">
                            + Create Program
                        </button>
                    )}
                </div>
            )}

            {/* ── Folder-grouped Programs ─────────────────────────── */}
            {!loading && folders.length > 0 && (
                <LayoutGroup>
                    <div className="space-y-4">
                        {folders.map(({ config: folder, programs: folderProgs }) => {
                            const isOpen = !collapsed[folder.key];
                            return (
                                <div key={folder.key} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-xl overflow-hidden">
                                    {/* Folder Header */}
                                    <button
                                        onClick={() => toggleFolder(folder.key)}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--card-bg-hover)] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                             style={{ backgroundColor: `${folder.color}12`, border: `1px solid ${folder.color}25` }}>
                                            <svg className="w-4 h-4" style={{ color: folder.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={FOLDER_ICON_PATHS[folder.key] ?? FOLDER_ICON_PATHS.other} />
                                            </svg>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h2 className="text-sm font-bold text-obsidian-100">{folder.label}</h2>
                                        </div>
                                        <span className="text-[10px] text-obsidian-500 mr-1">{folderProgs.length}</span>
                                        <span className="text-obsidian-400"><ChevronIcon open={isOpen} /></span>
                                    </button>

                                    {/* Folder Contents — morphing layout */}
                                    {isOpen && (
                                        <div
                                            className={
                                                view === 'grid'
                                                    ? "px-3 sm:px-5 pb-5 pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                                                    : "px-3 sm:px-5 pb-4 pt-1 flex flex-col gap-1.5"
                                            }
                                        >
                                            {folderProgs.map((prog) => (
                                                <ProgramItem key={prog.id} prog={prog} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </LayoutGroup>
            )}

            {/* Create Program Modal */}
            {showCreate && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
                            <h2 className="text-lg font-bold text-obsidian-100 mb-1">Create New Program</h2>
                            <p className="text-xs text-obsidian-500 mb-5">Start building a new checklist or survey.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-obsidian-400 mb-1.5 uppercase tracking-wider">Program Name</label>
                                    <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                                        placeholder="e.g. Q1 Store Audit"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[#0d8c63]/20" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-obsidian-400 mb-1.5 uppercase tracking-wider">Type</label>
                                    <select value={newType} onChange={(e) => setNewType(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#0d8c63]/20">
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-obsidian-400 hover:text-obsidian-200 transition-colors">Cancel</button>
                                <button onClick={handleCreate} disabled={creating || !newName.trim()}
                                    className="px-5 py-2 rounded-xl bg-[#0d8c63] hover:bg-[#0d9e6f] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-[#0d8c63]/20 transition-all">
                                    {creating ? 'Creating...' : 'Create & Edit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
