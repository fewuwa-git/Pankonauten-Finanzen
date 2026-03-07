'use client';

import { useState } from 'react';

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
];

interface Settings {
    apiKey: string;
    apiKeySet: boolean;
    extractModel: string;
    matchModel: string;
    fallbackModel: string;
    timeWindowDays: number;
    maxTransactions: number;
    autoAssign: boolean;
    autoAssignThreshold: number;
}

interface Props {
    initial: Settings;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
                <h3 className="card-title" style={{ fontSize: 14 }}>{title}</h3>
            </div>
            <div className="card-body" style={{ paddingTop: 16 }}>
                {children}
            </div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                {label}
            </label>
            {children}
            {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{hint}</div>}
        </div>
    );
}

export default function BelegeKiSettings({ initial }: Props) {
    const [draft, setDraft] = useState<Settings>(initial);
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setDraft(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch('/api/admin/ki-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const d = await res.json();
                setError(d.error || 'Fehler beim Speichern');
            }
        } catch {
            setError('Netzwerkfehler');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        fontSize: 13,
        color: 'var(--text)',
        boxSizing: 'border-box' as const,
    };

    const selectStyle = { ...inputStyle };

    return (
        <div style={{ maxWidth: 680 }}>

            {/* API-Zugang */}
            <Section title="API-Zugang">
                <Field
                    label="Gemini API Key"
                    hint={draft.apiKeySet && !draft.apiKey.includes('•') === false ? 'API Key ist gesetzt. Neuen Wert eingeben zum Überschreiben.' : 'API Key aus .env.local wird als Fallback verwendet, wenn hier kein Key hinterlegt ist.'}
                >
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={draft.apiKey}
                            onChange={e => set('apiKey', e.target.value)}
                            placeholder={draft.apiKeySet ? 'Gesetzt – zum Ändern neu eingeben' : 'AIza...'}
                            style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(v => !v)}
                            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                        >
                            {showKey ? 'Verbergen' : 'Anzeigen'}
                        </button>
                    </div>
                    {draft.apiKeySet && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>API Key gesetzt</span>
                            <span style={{ color: 'var(--text-muted)' }}>{initial.apiKey}</span>
                        </div>
                    )}
                </Field>
            </Section>

            {/* KI-Modelle */}
            <Section title="KI-Modelle">
                <Field
                    label="Extraktionsmodell"
                    hint="Liest den Beleg und extrahiert Aussteller, Betrag, Datum und Rechnungsnummer."
                >
                    <select value={draft.extractModel} onChange={e => set('extractModel', e.target.value)} style={selectStyle}>
                        {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </Field>
                <Field
                    label="Matching-Modell"
                    hint="Vergleicht den Beleg mit der Buchungsliste und schlägt die 3 besten Treffer vor."
                >
                    <select value={draft.matchModel} onChange={e => set('matchModel', e.target.value)} style={selectStyle}>
                        {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </Field>
                <Field
                    label="Fallback-Modell"
                    hint="Wird bei 503-/429-Fehlern (Überlast, Quota) automatisch als Ausweichmodell genutzt."
                >
                    <select value={draft.fallbackModel} onChange={e => set('fallbackModel', e.target.value)} style={selectStyle}>
                        {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </Field>
            </Section>

            {/* Analyse-Parameter */}
            <Section title="Analyse-Parameter">
                <Field
                    label={`Zeitfenster: ±${draft.timeWindowDays} Tage`}
                    hint="Buchungen innerhalb dieses Zeitfensters um das Belegdatum werden für das Matching berücksichtigt. Bei weniger als 5 Treffern werden alle Buchungen verwendet."
                >
                    <input
                        type="range"
                        min={7} max={365} step={1}
                        value={draft.timeWindowDays}
                        onChange={e => set('timeWindowDays', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>7 Tage</span><span>365 Tage</span>
                    </div>
                </Field>
                <Field
                    label={`Max. Buchungen: ${draft.maxTransactions}`}
                    hint="Maximale Anzahl an Buchungen, die der KI für das Matching übergeben werden."
                >
                    <input
                        type="range"
                        min={50} max={500} step={10}
                        value={draft.maxTransactions}
                        onChange={e => set('maxTransactions', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>50</span><span>500</span>
                    </div>
                </Field>
            </Section>

            {/* Auto-Zuordnung */}
            <Section title="Auto-Zuordnung">
                <Field
                    label="Automatische Zuordnung"
                    hint={draft.autoAssign
                        ? `Belege mit einem Confidence-Score ≥ ${draft.autoAssignThreshold}% werden automatisch der passenden Buchung zugeordnet, ohne manuelle Bestätigung.`
                        : 'Wenn aktiviert, werden Belege mit hohem Confidence-Score automatisch zugeordnet.'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            onClick={() => set('autoAssign', !draft.autoAssign)}
                            style={{ width: 44, height: 24, borderRadius: 12, background: draft.autoAssign ? 'var(--primary)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                        >
                            <div style={{ position: 'absolute', top: 3, left: draft.autoAssign ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: draft.autoAssign ? 'var(--text)' : 'var(--text-muted)' }}>
                            {draft.autoAssign ? 'Aktiviert' : 'Deaktiviert'}
                        </span>
                    </div>
                </Field>
                <div style={{ opacity: draft.autoAssign ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                    <Field label={`Schwellenwert: ${draft.autoAssignThreshold}%`}>
                        <input
                            type="range"
                            min={50} max={100} step={1}
                            value={draft.autoAssignThreshold}
                            disabled={!draft.autoAssign}
                            onChange={e => set('autoAssignThreshold', Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            <span>50%</span><span>100%</span>
                        </div>
                    </Field>
                </div>
            </Section>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                >
                    {saving ? 'Speichern…' : 'Einstellungen speichern'}
                </button>
                {saved && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ Gespeichert</span>}
                {error && <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>}
            </div>
        </div>
    );
}
