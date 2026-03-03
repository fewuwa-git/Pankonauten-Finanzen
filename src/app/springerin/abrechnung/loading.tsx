export default function AbrechnungLoading() {
    return (
        <div className="app-layout">
            <div style={{ width: '240px', minHeight: '100vh', background: 'var(--bg-secondary)', flexShrink: 0 }} />
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <div style={{ height: '28px', width: '140px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <div style={{ height: '16px', width: '280px', borderRadius: '6px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', marginTop: '8px' }} />
                    </div>
                </div>
                <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ height: '48px', borderRadius: '8px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: '52px', borderRadius: '8px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.06}s` }} />
                    ))}
                </div>
            </main>
        </div>
    );
}
