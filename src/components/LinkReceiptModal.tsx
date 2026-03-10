'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtDate } from '@/lib/formatDate';

interface Transaction {
    id: string;
    date: string;
    description: string;
    counterparty: string;
    amount: number;
    category: string;
}

interface LinkReceiptModalProps {
    receiptId: string;
    fileName: string;
    pdfUrl?: string;
    linkedTransactionIds: Set<string>;
    onLinked: (receiptId: string, tx: Transaction) => void;
    onClose: () => void;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
}

export default function LinkReceiptModal({ receiptId, fileName, pdfUrl, linkedTransactionIds, onLinked, onClose }: LinkReceiptModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [linkingId, setLinkingId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const isFirstMount = useRef(true);

    useEffect(() => {
        fetch('/api/transactions')
            .then(r => r.json())
            .then(data => {
                const sorted = (Array.isArray(data) ? data : [])
                    .sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date));
                setTransactions(sorted);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isFirstMount.current) { isFirstMount.current = false; return; }
        setSearch('');
        setLinkingId(null);
        searchRef.current?.focus();
    }, [receiptId]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const filtered = useMemo(() => {
        let list = showAll ? transactions : transactions.filter(t => !linkedTransactionIds.has(t.id));
        if (search.trim()) {
            const term = search.toLowerCase();
            list = list.filter(t =>
                t.description.toLowerCase().includes(term) ||
                t.counterparty.toLowerCase().includes(term) ||
                t.category.toLowerCase().includes(term) ||
                t.date.includes(term)
            );
        }
        return list.slice(0, 50);
    }, [transactions, search, showAll, linkedTransactionIds]);

    async function handleLink(tx: Transaction) {
        setLinkingId(tx.id);
        await fetch(`/api/receipts/${receiptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_id: tx.id, method: 'manual' }),
        });
        onLinked(receiptId, tx);
    }

    function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    const isPdf = fileName.toLowerCase().endsWith('.pdf');

    return (
        <div
            onClick={handleBackdrop}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
            <div
                style={{
                    display: 'flex', flexDirection: 'row', gap: 0,
                    width: pdfUrl ? 'min(1400px, 95vw)' : 'min(750px, 95vw)',
                    height: '88vh',
                    background: 'var(--bg)', borderRadius: 'var(--radius)', overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                }}
            >
                {/* PDF-Panel */}
                {pdfUrl && (
                    <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', minWidth: 0 }}>
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>📄</span>
                            <span title={fileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{fileName}</span>
                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>↗ extern</a>
                        </div>
                        {isPdf ? (
                            <iframe src={pdfUrl} style={{ flex: 1, border: 'none', width: '100%' }} title={fileName} />
                        ) : (
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                                <img src={pdfUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                    </div>
                )}

                {/* Buchungsliste */}
                <div className="card" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 0, borderRadius: 0, boxShadow: 'none', border: 'none', height: '100%' }}>
                    {/* Header */}
                    <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div className="card-title" style={{ fontSize: 15 }}>🔗 Buchung zuordnen</div>
                            {!pdfUrl && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fileName}</div>
                            )}
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
                            {(['ohne Beleg', 'alle'] as const).map((label, i) => {
                                const active = i === 0 ? !showAll : showAll;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setShowAll(i === 1)}
                                        style={{
                                            fontSize: 11, padding: '3px 9px', borderRadius: 20, border: '1px solid var(--border)',
                                            background: active ? 'var(--navy)' : 'transparent',
                                            color: active ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer', fontWeight: active ? 600 : 400,
                                        }}
                                    >{label}</button>
                                );
                            })}
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <input
                            ref={searchRef}
                            autoFocus
                            type="text"
                            placeholder="Beschreibung, Gegenüber oder Kategorie suchen…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', padding: '8px 12px' }}
                        />
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Laden…</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Keine Buchungen gefunden.</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Datum</th>
                                        <th>Beschreibung</th>
                                        <th style={{ textAlign: 'right' }}>Betrag</th>
                                        <th style={{ width: '1%' }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(tx => {
                                        const hasReceipt = linkedTransactionIds.has(tx.id);
                                        return (
                                        <tr key={tx.id} style={{ cursor: 'pointer', opacity: hasReceipt ? 0.5 : 1 }} onClick={() => !linkingId && handleLink(tx)}>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-muted)' }}>
                                                {fmtDate(tx.date)}
                                            </td>
                                            <td style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: pdfUrl ? 160 : 220 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.description}>{tx.description}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.counterparty}</div>
                                            </td>
                                            <td className={`tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {(tx.amount >= 0 ? '+' : '') + formatCurrency(tx.amount)}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {hasReceipt ? (
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>📎 belegt</span>
                                                ) : (
                                                    <button
                                                        disabled={!!linkingId}
                                                        className="btn btn-primary"
                                                        style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap', opacity: linkingId === tx.id ? 0.6 : 1 }}
                                                    >
                                                        {linkingId === tx.id ? '…' : '→'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {!loading && (
                        <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                            {search ? `${filtered.length} Treffer` : `Letzte 50 Buchungen – Suchfeld nutzen um zu filtern`}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
