'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface State {
    impersonating: boolean;
    impersonatedUser: User | null;
    users: User[];
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Finanzvorstand',
    member: 'Vorstandsmitglied',
    springerin: 'Springer*in',
    eltern: 'Eltern',
};

const BAR_HEIGHT = 36;

export default function ImpersonationBar() {
    const router = useRouter();
    const [state, setState] = useState<State | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/impersonate')
            .then(r => r.ok ? r.json() : null)
            .then(data => setState(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!state) return;
        const style = document.createElement('style');
        style.id = 'impersonation-bar-offset';
        style.textContent = `
            .app-layout { margin-top: ${BAR_HEIGHT}px; }
            .sidebar { top: ${BAR_HEIGHT}px !important; height: calc(100vh - ${BAR_HEIGHT}px) !important; }
            .mobile-header { top: ${BAR_HEIGHT}px !important; }
            .sidebar-overlay { top: ${BAR_HEIGHT}px !important; }
            .page-header { top: ${BAR_HEIGHT}px !important; }
        `;
        document.head.appendChild(style);
        return () => { document.getElementById('impersonation-bar-offset')?.remove(); };
    }, [state]);

    // Dropdown schließen bei Klick außerhalb
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Fokus auf Suche wenn geöffnet
    useEffect(() => {
        if (open) {
            setSearch('');
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open]);

    if (!state) return null;

    async function refreshState() {
        const data = await fetch('/api/impersonate').then(r => r.ok ? r.json() : null);
        setState(data);
    }

    async function impersonate(user: User) {
        setLoading(true);
        await fetch('/api/impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        });
        await refreshState();
        setLoading(false);
        setOpen(false);
        router.refresh();
    }

    async function reset() {
        setLoading(true);
        await fetch('/api/impersonate', { method: 'DELETE' });
        await refreshState();
        setLoading(false);
        setOpen(false);
        router.refresh();
    }

    const isImpersonating = state.impersonating;
    const filtered = state.users
        .filter(u =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            (ROLE_LABELS[u.role] ?? u.role).toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: isImpersonating ? '#7c3aed' : '#1e293b',
            color: '#fff',
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            transition: 'background 0.2s',
        }}>
            {/* Kollabierte Leiste – Inhalt rechtsbündig */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', height: `${BAR_HEIGHT}px`, gap: '10px' }}>
                {isImpersonating && (
                    <>
                        <span style={{ opacity: 0.75, fontSize: '12px' }}>
                            Ansicht als: <strong>{state.impersonatedUser?.name}</strong>&nbsp;
                            <span style={{ opacity: 0.7, fontWeight: 400 }}>({ROLE_LABELS[state.impersonatedUser?.role ?? ''] ?? state.impersonatedUser?.role})</span>
                        </span>
                        <button
                            onClick={reset}
                            disabled={loading}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                        >
                            Zurücksetzen
                        </button>
                    </>
                )}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setOpen(o => !o)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                    >
                        <span>👁</span>
                        Ansicht wechseln
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>{open ? '▲' : '▼'}</span>
                    </button>

                    {/* Dropdown */}
                    {open && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            minWidth: '240px',
                            overflow: 'hidden',
                        }}>
                            {/* Suche */}
                            <div style={{ padding: '8px' }}>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Name suchen …"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        padding: '5px 8px',
                                        fontSize: '12px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* User-Liste */}
                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                {filtered.length === 0 && (
                                    <div style={{ padding: '10px 12px', opacity: 0.5, fontSize: '12px' }}>Keine Treffer</div>
                                )}
                                {filtered.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => impersonate(u)}
                                        disabled={loading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            background: state.impersonatedUser?.id === u.id ? 'rgba(124,58,237,0.4)' : 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '8px 12px',
                                            cursor: loading ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                            gap: '8px',
                                        }}
                                        onMouseEnter={e => { if (state.impersonatedUser?.id !== u.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { if (state.impersonatedUser?.id !== u.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        <span style={{ opacity: 0.55, fontSize: '11px', whiteSpace: 'nowrap' }}>{ROLE_LABELS[u.role] ?? u.role}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
