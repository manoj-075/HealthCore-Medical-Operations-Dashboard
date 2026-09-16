import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CreditCard, Shield, Filter, RotateCcw } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import { LoadingState, ErrorState } from '../components/States'
import { getDepartments, getFinanceAnalytics } from '../services/api'
import { fmt, COLORS, CHART_COLORS } from '../utils/formatters'

const STATUS_COLORS = { Paid: '#45a282', 'Insurance Claimed': '#6aa9c9', 'Partially Paid': '#ca9152', Pending: '#d85d7a' }

export default function Finance() {
  const [summary, setSummary] = useState(null)
  const [payment, setPayment] = useState([])
  const [revDept, setRevDept] = useState([])
  const [insurance, setInsurance] = useState([])
  const [trend, setTrend] = useState([])
  const [departments, setDepartments] = useState([])
  
  const [departmentId, setDepartmentId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [insured, setInsured] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [trendRange, setTrendRange] = useState(9)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDepartments().then(response => setDepartments(response.data)).catch(() => setError(true))
  }, [])

  useEffect(() => {
    let current = true
    setLoading(true); setError(false)
    getFinanceAnalytics({
      department_id: departmentId || undefined, payment_status: paymentStatus || undefined,
      insured: insured === '' ? undefined : insured === 'insured', min_amount: minAmount || undefined,
      max_amount: maxAmount || undefined, start_date: startDate || undefined, end_date: endDate || undefined,
    }).then(({ data }) => {
      if (!current) return
      setSummary(data.summary); setPayment(data.payment); setRevDept(data.revenue_by_department)
      setInsurance(data.insurance); setTrend(data.trend)
    }).catch(() => { if (current) setError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [departmentId, paymentStatus, insured, minAmount, maxAmount, startDate, endDate])

  const hasActiveFilters = Boolean(departmentId || paymentStatus || insured || minAmount || maxAmount || startDate || endDate)

  const clearFilters = () => {
    setDepartmentId('')
    setPaymentStatus('')
    setMinAmount(''); setMaxAmount(''); setInsured(''); setStartDate(''); setEndDate('')
  }

  if (loading) return <LoadingState />
  if (error || !summary) return <ErrorState />

  const activeSummary = summary
  const filteredDepartments = revDept
  const visiblePayment = payment
  const visibleTrend = trend.slice(-trendRange)
  const rankedDepartments = [...filteredDepartments].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 6)
  const revenueMax = rankedDepartments[0]?.total_revenue || 1
  const topRevenue = rankedDepartments[0]
  const topAverage = [...filteredDepartments].sort((a, b) => (b.total_revenue / (b.bill_count || 1)) - (a.total_revenue / (a.bill_count || 1)))[0]
  const topCollection = [...filteredDepartments].sort((a, b) => (b.total_paid / (b.total_revenue || 1)) - (a.total_paid / (a.total_revenue || 1)))[0]

  const insights = [
    topRevenue && { label: 'Highest revenue department', value: topRevenue.department, sub: fmt.currency(topRevenue.total_revenue) },
    topAverage && { label: 'Highest average bill', value: topAverage.department, sub: fmt.currency(topAverage.total_revenue / (topAverage.bill_count || 1)) },
    topCollection && { label: 'Strongest collection rate', value: topCollection.department, sub: fmt.pct(topCollection.total_revenue ? (topCollection.total_paid / topCollection.total_revenue) * 100 : 0) },
  ].filter(Boolean)

  return (
    <div className="finance-page">
      <div className="filter-bar finance-filter-bar mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div className="filter-heading"><Filter size={15} /> Financial filters</div>
        <label>Department
          <select value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label>Payment Status
          <select value={paymentStatus} onChange={event => setPaymentStatus(event.target.value)}>
            <option value="">All payment statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="Insurance Claimed">Insurance Claimed</option>
          </select>
        </label>
        <label>Min Bill Amount
          <input type="number" min="0" placeholder="Any amount" value={minAmount} onChange={event => setMinAmount(event.target.value)} />
          {/*
            <option value={0}>All amounts</option>
            <option value={1000000}>&gt; ₹10 Lakhs</option>
            <option value={3000000}>&gt; ₹30 Lakhs</option>
            <option value={5000000}>&gt; ₹50 Lakhs</option>
          */}
        </label>
        <label>Max Bill Amount
          <input type="number" min="0" placeholder="Any amount" value={maxAmount} onChange={event => setMaxAmount(event.target.value)} />
        </label>
        <label>Insurance
          <select value={insured} onChange={event => setInsured(event.target.value)}>
            <option value="">All bills</option>
            <option value="insured">Insurance covered</option>
            <option value="uninsured">No insurance</option>
          </select>
        </label>
        <label>From
          <input type="date" value={startDate} max={endDate || undefined} onChange={event => setStartDate(event.target.value)} />
        </label>
        <label>To
          <input type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} />
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '10px',
              background: 'var(--primary-light)', color: 'var(--primary)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} /> Clear Filters
          </button>
        )}
      </div>

      <div className="kpi-grid finance-kpis mb-4">
        <KpiCard title="Total Revenue" value={fmt.currency(activeSummary.total_revenue)} icon={<DollarSign size={16}/>} iconBg="#edfaf5" iconColor="#4b9a7c" sub="billed revenue" />
        <KpiCard title="Collected" value={fmt.currency(activeSummary.total_paid)} icon={<TrendingUp size={16}/>} iconBg="#eff6ff" iconColor="#2563eb" sub={`${fmt.pct(activeSummary.collection_rate)} collected`} />
        <KpiCard title="Outstanding" value={fmt.currency(activeSummary.outstanding_balance)} icon={<AlertCircle size={16}/>} iconBg="#fff1f5" iconColor="#d85d7a" sub="pending collection" />
        <KpiCard title="Total Bills" value={fmt.number(activeSummary.total_bills)} icon={<CreditCard size={16}/>} iconBg="#f4efff" iconColor="#9275ce" sub="billing episodes" />
        <KpiCard title="Avg Bill" value={fmt.currency(activeSummary.avg_bill_amount)} icon={<DollarSign size={16}/>} iconBg="#fff7ed" iconColor="#ca9152" sub="per patient" />
        <KpiCard title="Insurance" value={fmt.currency(activeSummary.insurance_coverage)} icon={<Shield size={16}/>} iconBg="#edf6ff" iconColor="#5599e5" sub="total coverage" />
      </div>

      <div className="finance-main-grid mb-4">
        <ChartCard title="Revenue & Collection Trend" sub="Monthly billed revenue vs collected payments" action={
          <label className="chart-pill-select">
            <span className="sr-only">Revenue trend range</span>
            <select aria-label="Revenue trend range" value={trendRange} onChange={event => setTrendRange(Number(event.target.value))}>
              {[6, 9, 12].map(months => <option key={months} value={months}>Last {months} Months</option>)}
            </select>
          </label>
        }>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={visibleTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#45a282" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#45a282" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a8dee" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5a8dee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee7e7" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#71849a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71849a' }} width={38} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={v => fmt.currency(v)} />
              <Area type="monotone" dataKey="revenue" name="Billed Revenue" stroke="#45a282" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#5a8dee" fill="url(#colGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Status Breakdown" sub="Billing volume by status">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={visiblePayment} dataKey="amount" nameKey="status" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                {visiblePayment.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? COLORS[0]} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmt.currency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="finance-bottom-grid">
        <ChartCard title="Department Revenue Ranking" sub="Total billed revenue by department">
          <div className="finance-demand-list">
            {rankedDepartments.map(d => (
              <div className="finance-demand-row" key={d.department}>
                <div><span>{d.department}</span><strong>{fmt.currency(d.total_revenue)}</strong></div>
                <div className="demand-track"><span style={{ width: `${(d.total_revenue / revenueMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Insurance Analysis" sub="Coverage breakdown by status">
          <div className="finance-insight-list">
            {insurance.map(i => (
              <div className="finance-insight-row" key={i.payment_status}>
                <Shield size={16} style={{ color: 'var(--primary)' }} />
                <div>
                  <strong>{i.payment_status}: {fmt.currency(i.total_insured)}</strong>
                  <small>{fmt.number(i.count)} claims · avg {fmt.currency(i.avg_insured)}</small>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Financial Insights" sub="Key performance highlights">
          <div className="finance-insight-list">
            {insights.map(i => (
              <div className="finance-insight-row" key={i.label}>
                <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                <div>
                  <strong>{i.value}</strong>
                  <small>{i.label} · {i.sub}</small>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
