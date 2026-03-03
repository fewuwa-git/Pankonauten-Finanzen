import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getTransactionsByCounterparty } from '@/lib/data';
import Sidebar from '@/components/Sidebar';
import KontoauszugClient from '@/components/KontoauszugClient';

async function MeineBuchungenSection({ name }: { name: string }) {
    const transactions = await getTransactionsByCounterparty(name);
    return (
        <>
            {transactions.length === 0 && (
                <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
                    Keine Buchungen für „{name}" gefunden.
                </div>
            )}
            {transactions.length > 0 && (
                <KontoauszugClient transactions={transactions} />
            )}
        </>
    );
}

function MeineBuchungenSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...Array(8)].map((_, i) => (
                <div key={i} style={{ height: '52px', borderRadius: '8px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
            ))}
        </div>
    );
}

export default async function MeineBuchungenPage() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role') as 'admin' | 'member' | 'eltern' | 'springerin' | null;
    const name = headersList.get('x-user-name') || '';
    const email = headersList.get('x-user-email') || '';

    if (!userId || !role) redirect('/login');
    if (role !== 'eltern' && role !== 'member') redirect('/dashboard');

    return (
        <div className="app-layout">
            <Sidebar user={{ name, email, role }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>Meine Buchungen</h1>
                        <p>Alle Buchungen für {name}</p>
                    </div>
                </div>
                <div className="page-body">
                    <Suspense fallback={<MeineBuchungenSkeleton />}>
                        <MeineBuchungenSection name={name} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
