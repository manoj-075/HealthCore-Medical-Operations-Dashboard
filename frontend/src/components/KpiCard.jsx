export default function KpiCard({ title, value, sub, icon, iconBg = '#eff6ff', iconColor = '#2563eb', badge, badgeType = 'neutral' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <div>
          <div className="kpi-card-label">{title}</div>
          <div className="kpi-card-value">{value}</div>
          {sub && <div className="kpi-card-sub">{sub}</div>}
        </div>
        {icon && (
          <div className="kpi-card-icon" style={{ background: iconBg }}>
            <span style={{ color: iconColor }}>{icon}</span>
          </div>
        )}
      </div>
      {badge != null && (
        <span className={`kpi-badge ${badgeType}`}>{badge}</span>
      )}
    </div>
  )
}
