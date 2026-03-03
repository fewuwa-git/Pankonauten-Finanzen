export default function SpringerinDashboardLoading() {
    return (
        <div className="app-layout">
            <div style={{ width: '240px', minHeight: '100vh', background: 'var(--bg-secondary)', flexShrink: 0 }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <div style={{ height: '28px', width: '200px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <div style={{ height: '16px', width: '300px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', marginTop: '8px' }} />
                    </div>
                </div>
                <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ height: '80px', borderRadius: '10px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ height: '60px', borderRadius: '8px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
                    ))}
                </div>
            </main>
        </div>
    );
}
