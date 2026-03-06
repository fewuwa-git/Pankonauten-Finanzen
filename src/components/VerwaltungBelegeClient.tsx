'use client';

import { useState, useMemo } from 'react';
import type { TransactionReceipt } from '@/lib/data';

function formatSize(bytes: number | null | undefined): string {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
}

interface Props {
    receipts: TransactionReceipt[];
}

export default function VerwaltungBelegeClient({ receipts: initial }: Props) {
    const [receipts, setReceipts] = useState(initial);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return receipts;
        const term = search.toLowerCase();
        return receipts.filter(r =>
            r.transaction_description.toLowerCase().includes(term) ||
            r.transaction_counterparty.toLowerCase().includes(term) ||
            r.transaction_category.toLowerCase().includes(term) ||
            r.file_name.toLowerCase().includes(term)
        );
    }, [receipts, search]);

    async function handleOpen(r: TransactionReceipt) {
        if (signedUrls[r.id]) { window.open(signedUrls[r.id], '_blank'); return; }
        setLoadingUrl(r.id);
        const res = await fetch(`/api/transactions/${r.transaction_id}/receipts`);
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((x: any) => x.id === r.id) : null;
        if (found?.url) {
            setSignedUrls(prev => ({ ...prev, [r.id]: found.url }));
            window.open(found.url, '_blank');
        }
        setLoadingUrl(null);
    }

    async function handleDelete(r: TransactionReceipt) {
        if (!confirm(`Beleg „${r.file_name}" wirklich löschen?`)) return;
        setDeletingId(r.id);
        await fetch(`/api/transactions/${r.transaction_id}/receipts/${r.id}`, { method: 'DELETE' });
        setReceipts(prev => prev.filter(x => x.id !== r.id));
        setDeletingId(null);
    }

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="stat-card" style={{ padding: '12px 16px' }}>
                    <div className="stat-card-label">📎 Belege gesamt</div>
                    <div className="stat-card-value" style={{ fontSize: 20 }}>{receipts.length}</div>
                    <div className="stat-card-sub">Hochgeladene Dateien</div>
                </div>
                <div className="stat-card" style={{ padding: '12px 16px' }}>
                    <div className="stat-card-label">🧾 Buchungen mit Beleg</div>
                    <div className="stat-card-value" style={{ fontSize: 20 }}>{new Set(receipts.map(r => r.transaction_id)).size}</div>
                    <div className="stat-card-sub">Eindeutige Buchungen</div>
                </div>
                <div className="stat-card" style={{ padding: '12px 16px' }}>
                    <div className="stat-card-label">💾 Gesamtgröße</div>
                    <div className="stat-card-value" style={{ fontSize: 20 }}>
                        {formatSize(receipts.reduce((s, r) => s + (r.file_size || 0), 0))}
                    </div>
                    <div className="stat-card-sub">Speicherverbrauch</div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div className="card-title">📎 Alle Belege</div>
                    <input
                        type="text"
                        placeholder="Suchen…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-input"
                        style={{ padding: '8px 12px', width: 240 }}
                    />
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Buchungsdatum</th>
                                <th>Beschreibung</th>
                                <th>Gegenüber</th>
                                <th>Kategorie</th>
                                <th style={{ textAlign: 'right' }}>Betrag</th>
                                <th>Dateiname</th>
                                <th style={{ textAlign: 'right' }}>Größe</th>
                                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Hochgeladen am</th>
                                <th style={{ width: '1%' }} />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                        {search ? 'Keine Belege gefunden.' : 'Noch keine Belege hochgeladen.'}
                                    </td>
                                </tr>
                            ) : filtered.map(r => (
                                <tr key={r.id}>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 13 }}>
                                        {r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('de-DE') : '–'}
                                    </td>
                                    <td style={{ fontSize: 13, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span title={r.transaction_description}>{r.transaction_description || '–'}</span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.transaction_counterparty || '–'}
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                        <span className="category-badge" style={{ fontSize: 11 }}>
                                            {r.transaction_category || '–'}
                                        </span>
                                    </td>
                                    <td className={`tx-amount ${r.transaction_amount >= 0 ? 'positive' : 'negative'}`} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {(r.transaction_amount >= 0 ? '+' : '') + formatCurrency(r.transaction_amount)}
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span>{r.file_name.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }} title={r.file_name}>
                                                {r.file_name}
                                            </span>
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {formatSize(r.file_size)}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>
                                        {new Date(r.uploaded_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleOpen(r)}
                                                disabled={loadingUrl === r.id}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', padding: '2px 6px', opacity: loadingUrl === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}
                                            >
                                                Öffnen ↗
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r)}
                                                disabled={deletingId === r.id}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--red)', padding: '2px 4px', opacity: deletingId === r.id ? 0.5 : 1 }}
                                                title="Löschen"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
