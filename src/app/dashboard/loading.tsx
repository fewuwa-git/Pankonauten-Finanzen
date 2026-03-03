export default function DashboardLoading() {
    return (
        <div className="app-layout">
            <div style={{ width: '240px', minHeight: '100vh', background: 'var(--bg-secondary)', flexShrink: 0 }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <div style={{ height: '28px', width: '140px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <div style={{ height: '16px', width: '260px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', marginTop: '8px' }} />
                    </div>
                </div>
                <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '100px', borderRadius: '12px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        ))}
                    </div>
                    <div style={{ height: '320px', borderRadius: '12px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
            </main>
        </div>
    );
}
