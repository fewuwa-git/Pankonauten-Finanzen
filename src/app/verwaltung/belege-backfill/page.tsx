'use client';

import { useState } from 'react';
import { generateAbrechnungPDF } from '@/lib/pdf';
import { generateBelegPDF } from '@/lib/belegPdf';

type Status = 'idle' | 'pending' | 'ok' | 'duplicate' | 'error';

interface Item {
    key: string;
    label: string;
    status: Status;
    note?: string;
}

async function uploadBlob(blob: Blob, fileName: string): Promise<'ok' | 'duplicate' | 'error'> {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/receipts', { method: 'POST', body: formData });
    if (res.status === 409) return 'duplicate';
    if (res.ok) return 'ok';
    return 'error';
}

export default function BelegeBackfillPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const updateItem = (key: string, update: Partial<Item>) =>
        setItems(prev => prev.map(i => i.key === key ? { ...i, ...update } : i));

    const handleStart = async () => {
        setRunning(true);
        setDone(false);

        const res = await fetch('/api/admin/backfill-pdfs');
        if (!res.ok) {
            alert('Fehler beim Laden der Daten.');
            setRunning(false);
            return;
        }
        const { abrechnungen, belege } = await res.json();

        const allItems: Item[] = [
            ...abrechnungen.map((a: any) => ({
                key: `abr-${a.id}`,
                label: `Abrechnung: ${a.pankonauten_users?.name || '?'} ${a.jahr}-${String(a.monat).padStart(2, '0')}`,
                status: 'idle' as Status,
            })),
            ...belege.map((b: any) => ({
                key: `bel-${b.id}`,
                label: `Beleg: ${b.belegnummer || b.id} – ${b.titel}`,
                status: 'idle' as Status,
            })),
        ];
        setItems(allItems);

        for (const a of abrechnungen) {
            const key = `abr-${a.id}`;
            updateItem(key, { status: 'pending' });
            try {
                const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                const monthLabel = `${a.jahr} – ${monthNames[a.monat - 1]}`;
                const tage = a.pankonauten_abrechnung_tage || [];
                const blobUrl = await generateAbrechnungPDF(
                    a.pankonauten_users, monthLabel, tage,
                    a.totalStunden, a.totalBetrag, a.id, a.jahr, a.monat
                );
                const blobRes = await fetch(blobUrl);
                const blob = await blobRes.blob();
                URL.revokeObjectURL(blobUrl);

                const safeName = (a.pankonauten_users?.name || 'Unbekannt').replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
                const result = await uploadBlob(blob, `Abrechnung_${safeName}_${a.jahr}-${String(a.monat).padStart(2, '0')}.pdf`);
                updateItem(key, { status: result });
            } catch (e: any) {
                updateItem(key, { status: 'error', note: e?.message });
            }
        }

        for (const b of belege) {
            const key = `bel-${b.id}`;
            updateItem(key, { status: 'pending' });
            try {
                const blobUrl = await generateBelegPDF(b);
                const blobRes = await fetch(blobUrl);
                const blob = await blobRes.blob();
                URL.revokeObjectURL(blobUrl);

                const safeName = (b.belegnummer || b.titel).replace(/[^a-zA-Z0-9äöüÄÖÜß\-]/g, '_');
                const result = await uploadBlob(blob, `Beleg_${safeName}.pdf`);
                updateItem(key, { status: result });
            } catch (e: any) {
                updateItem(key, { status: 'error', note: e?.message });
            }
        }

        setRunning(false);
        setDone(true);
    };

    const statusIcon: Record<Status, string> = {
        idle: '⬜',
        pending: '⏳',
        ok: '✅',
        duplicate: '🔁',
        error: '❌',
    };

    const counts = {
        ok: items.filter(i => i.status === 'ok').length,
        duplicate: items.filter(i => i.status === 'duplicate').length,
        error: items.filter(i => i.status === 'error').length,
    };

    return (
        <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px' }}>
            <h1 style={{ marginBottom: 8 }}>Rückwirkender PDF-Upload</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                Generiert PDFs für alle bezahlten Abrechnungen und Eltern-Belege und lädt sie als unzugeordnete Belege in die Belegverwaltung hoch. Duplikate werden übersprungen.
            </p>

            <button
                onClick={handleStart}
                disabled={running}
                className="btn btn-primary"
                style={{ marginBottom: 32 }}
            >
                {running ? '⏳ Läuft...' : '🚀 Backfill starten'}
            </button>

            {done && (
                <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, background: 'var(--green-bg)', color: '#16a34a', fontWeight: 600 }}>
                    Fertig! {counts.ok} hochgeladen · {counts.duplicate} bereits vorhanden · {counts.error} Fehler
                </div>
            )}

            {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map(item => (
                        <div key={item.key} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 6,
                            background: item.status === 'ok' ? 'var(--green-bg)'
                                : item.status === 'error' ? '#fee2e2'
                                    : item.status === 'pending' ? 'var(--blue-bg)'
                                        : 'var(--bg)',
                            fontSize: 14,
                        }}>
                            <span>{statusIcon[item.status]}</span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.status === 'duplicate' && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>bereits vorhanden</span>}
                            {item.note && <span style={{ fontSize: 12, color: '#dc2626' }}>{item.note}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
