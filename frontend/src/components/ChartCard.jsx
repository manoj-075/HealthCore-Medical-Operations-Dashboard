export default function ChartCard({ title, sub, children, action }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">{title}</div>
          {sub && <div className="chart-card-sub">{sub}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  )
}
