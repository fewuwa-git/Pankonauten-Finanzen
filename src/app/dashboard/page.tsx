import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getTransactions } from '@/lib/data';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = { title: 'Dashboard' };
import DashboardClient from '@/components/DashboardClient';

async function TransactionsSection() {
    const transactions = await getTransactions();
    return <DashboardClient transactions={transactions} />;
}

function TransactionsSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '100px', borderRadius: '12px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
            </div>
            <div style={{ height: '320px', borderRadius: '12px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
    );
}

export default async function DashboardPage() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role') as 'admin' | 'member' | 'eltern' | 'springerin' | null;
    const name = headersList.get('x-user-name') || '';
    const email = headersList.get('x-user-email') || '';

    if (!userId || !role) redirect('/login');
    if (role === 'springerin') redirect('/springerin/abrechnung');
    if (role !== 'admin' && role !== 'member') {
        return <div style={{ padding: '2rem' }}>Zugriff verweigert. Diese Seite ist nur für Vorstandsmitglieder zugänglich.</div>;
    }

    return (
        <div className="app-layout">
            <Sidebar user={{ name, email, role }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>Kontostand</h1>
                        <p>Finanzieller Überblick der Kita Pankonauten</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Willkommen, {name.split(' ')[0]} 👋
                        </span>
                    </div>
                </div>
                <div className="page-body">
                    <Suspense fallback={<TransactionsSkeleton />}>
                        <TransactionsSection />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
