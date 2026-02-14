import '../index.css'

/* Skeleton shimmer components for loading states */
export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-line skeleton-line-sm" style={{ width: '40%' }}></div>
            <div className="skeleton-line skeleton-line-lg" style={{ width: '60%', marginTop: 12 }}></div>
            <div className="skeleton-line skeleton-line-sm" style={{ width: '30%', marginTop: 8 }}></div>
        </div>
    )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="skeleton-table">
            <div className="skeleton-table-header">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="skeleton-line skeleton-line-sm" style={{ width: `${60 + Math.random() * 40}%` }}></div>
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="skeleton-table-row">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="skeleton-line skeleton-line-sm" style={{ width: `${50 + Math.random() * 50}%` }}></div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export function SkeletonChart() {
    return (
        <div className="skeleton-chart">
            <div className="skeleton-line skeleton-line-sm" style={{ width: '30%', marginBottom: 16 }}></div>
            <div className="skeleton-chart-bars">
                {[60, 80, 45, 90, 70, 55].map((h, i) => (
                    <div key={i} className="skeleton-bar" style={{ height: `${h}%` }}></div>
                ))}
            </div>
        </div>
    )
}

export function SkeletonStats() {
    return (
        <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-line-sm" style={{ width: '50%' }}></div>
                    <div className="skeleton-line skeleton-line-xl" style={{ width: '40%', marginTop: 12 }}></div>
                    <div className="skeleton-line skeleton-line-sm" style={{ width: '60%', marginTop: 8 }}></div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonPage() {
    return (
        <div className="page-fade-in">
            <SkeletonStats />
            <div className="dashboard-grid" style={{ marginTop: 20 }}>
                <SkeletonChart />
                <SkeletonChart />
            </div>
        </div>
    )
}
