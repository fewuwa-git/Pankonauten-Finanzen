import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getEmailTemplates } from '@/lib/data';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = { title: 'E-Mail-Templates' };

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
    invite: 'Wird verschickt, wenn ein Admin einen neuen Benutzer per Einladungslink anlegt.',
    approval: 'Wird verschickt, wenn ein Admin einen selbst registrierten Account freischaltet.',
    password_reset: 'Wird verschickt, wenn ein Benutzer sein Passwort zurücksetzen möchte.',
};

export default async function EmailTemplatesPage() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role') as 'admin' | 'member' | 'eltern' | 'springerin' | null;
    const name = headersList.get('x-user-name') || '';
    const email = headersList.get('x-user-email') || '';

    if (!userId || !role) redirect('/login');
    if (role !== 'admin') redirect('/dashboard');

    const templates = await getEmailTemplates();

    return (
        <div className="app-layout">
            <Sidebar user={{ name, email, role }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>E-Mail-Templates</h1>
                        <p>Bearbeite die Texte der automatisch versendeten E-Mails</p>
                    </div>
                </div>
                <div className="page-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {templates.map((t) => (
                            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{t.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        {TEMPLATE_DESCRIPTIONS[t.id] || ''}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Betreff: <span style={{ color: 'var(--text)' }}>{t.subject}</span>
                                    </div>
                                </div>
                                <Link href={`/verwaltung/emails/${t.id}`} className="btn btn-secondary btn-sm">
                                    Bearbeiten
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
