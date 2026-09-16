import { useEffect, useState } from 'react'
import { Users, BedDouble, DollarSign, Activity, Boxes, MapPin, HeartPulse, ArrowUpRight, Filter, RotateCcw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import GeographicMap from '../components/GeographicMap'
import { LoadingState, ErrorState } from '../components/States'
import { getOverview, getAdmissionTrend, getDeptPerformance, getDepartments, getPatientAnalytics } from '../services/api'
import { fmt } from '../utils/formatters'

const GENDER_COLORS = ['#ee6d9d', '#5a8dee', '#9a83d6']

export default function Overview() {
  const [overview, setOverview]   = useState(null)
  const [trend, setTrend]         = useState([])
  const [deptPerf, setDeptPerf]   = useState([])
  const [patients, setPatients]   = useState(null)
  const [overviewGeography, setOverviewGeography] = useState(null)
  const [departments, setDepartments] = useState([])

  const [departmentId, setDepartmentId] = useState('')
  const [thresholdDays, setThresholdDays] = useState(7)
  const [gender, setGender] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  const [statesList, setStatesList] = useState([])
  const [citiesList, setCitiesList] = useState([])

  const [trendRange, setTrendRange] = useState(9)
  const [patientLoading, setPatientLoading] = useState(true)
  const [patientError, setPatientError] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  useEffect(() => {
    Promise.all([getOverview(), getAdmissionTrend(), getDeptPerformance()])
      .then(([ov, tr, dp]) => {
        setOverview(ov.data)
        setTrend(tr.data)
        setDeptPerf(dp.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getDepartments()
      .then(response => setDepartments(response.data))
      .catch(() => setPatientError(true))
  }, [])

  useEffect(() => {
    let current = true
    setPatientLoading(true)
    setPatientError(false)
    getPatientAnalytics({
      department_id: departmentId || undefined,
      threshold_days: thresholdDays,
      gender: gender || undefined,
      state: stateFilter || undefined,
      city: cityFilter || undefined,
    })
      .then(response => {
        if (current) {
          setPatients(response.data)
          if (!departmentId && thresholdDays === 7 && !gender && !stateFilter && !cityFilter) {
            setOverviewGeography(response.data.geography)
          }
          if (statesList.length === 0 && response.data.geography?.by_state) {
            setStatesList(response.data.geography.by_state.map(s => s.state))
          }
          if (citiesList.length === 0 && response.data.geography?.by_city) {
            setCitiesList(Array.from(new Set(response.data.geography.by_city.map(c => c.city))))
          }
        }
      })
      .catch(() => { if (current) setPatientError(true) })
      .finally(() => { if (current) setPatientLoading(false) })
    return () => { current = false }
  }, [departmentId, thresholdDays, gender, stateFilter, cityFilter])

  const hasActiveFilters = Boolean(departmentId || gender || stateFilter || cityFilter || thresholdDays !== 7)

  const clearFilters = () => {
    setDepartmentId('')
    setThresholdDays(7)
    setGender('')
    setStateFilter('')
    setCityFilter('')
  }

  if (loading) return <LoadingState />
  if (error)   return <ErrorState />

  const genderData = patients?.gender || []
  const activeGeo = patients?.geography || overviewGeography
  const geography = activeGeo?.by_city || []
  const states = activeGeo?.by_state || []
  const topCities = geography.slice(0, 5)
  const topDepartments = deptPerf.slice(0, 5)
  const demandMax = topDepartments[0]?.admissions || 1
  const totalDepartmentAdmissions = deptPerf.reduce((total, department) => total + department.admissions, 0) || 1
  const visibleTrend = trend.slice(-trendRange)

  const activeTotalPatients = patients?.summary?.total_patients ?? overview.total_patients

  const highDemand = [
    topCities[0] && { icon: <MapPin size={15} />, label: 'Highest patient volume', value: topCities[0].city, sub: `${fmt.number(topCities[0].count)} patients` },
    topDepartments[0] && { icon: <HeartPulse size={15} />, label: 'Highest department demand', value: topDepartments[0].department, sub: `${fmt.number(topDepartments[0].admissions)} admissions` },
    states[0] && { icon: <Activity size={15} />, label: 'Highest patient concentration', value: states[0].state, sub: `${fmt.pct((states[0].count / (activeTotalPatients || 1)) * 100)} of patients` },
  ].filter(Boolean)

  return (
    <div className="overview-page">
      <section className="welcome-row mb-4">
        <div>
          <div className="eyebrow">EXECUTIVE COMMAND CENTER</div>
          <h2>Good morning, Manoj <span className="greeting-wave">👋</span></h2>
          <h3>HealthCore</h3>
          <p>Healthcare Intelligence &amp; Operations Platform</p>
        </div>
        <div className="welcome-context">
          <span className="context-dot" /> Live PostgreSQL data
        </div>
      </section>

      <div className="filter-bar mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.72)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--border)' }}>
        <div className="filter-heading" style={{ fontSize: '12px' }}><Filter size={14} /> Global Filters</div>
        <label style={{ fontSize: '10px' }}>Department
          <select style={{ fontSize: '11px', padding: '4px 8px' }} value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '10px' }}>Gender
          <select style={{ fontSize: '11px', padding: '4px 8px' }} value={gender} onChange={event => setGender(event.target.value)}>
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label style={{ fontSize: '10px' }}>State
          <select style={{ fontSize: '11px', padding: '4px 8px' }} value={stateFilter} onChange={event => setStateFilter(event.target.value)}>
            <option value="">All States</option>
            {statesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '10px' }}>City
          <select style={{ fontSize: '11px', padding: '4px 8px' }} value={cityFilter} onChange={event => setCityFilter(event.target.value)}>
            <option value="">All Cities</option>
            {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '10px' }}>Long-stay Threshold
          <select style={{ fontSize: '11px', padding: '4px 8px' }} value={thresholdDays} onChange={event => setThresholdDays(Number(event.target.value))}>
            {[7, 10, 14, 30].map(days => <option key={days} value={days}>{days}+ Days</option>)}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', border: '1px solid var(--border)', borderRadius: '8px',
              background: 'var(--primary-light)', color: 'var(--primary)',
              fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto'
            }}
          >
            <RotateCcw size={11} /> Clear Filters
          </button>
        )}
      </div>

      <div className="kpi-grid kpi-grid-6 compact-kpis mb-4">
        <KpiCard title="Total Patients" value={fmt.number(activeTotalPatients)} icon={<Users size={16}/>} iconBg="#fff0f6" iconColor="#e45b92" sub={hasActiveFilters ? "matching filters" : "registered patients"} />
        <KpiCard title="Total Admissions" value={fmt.number(patients?.summary?.total_admissions ?? overview.total_admissions)} icon={<Activity size={16}/>} iconBg="#f0efff" iconColor="#7568c8" sub="admission episodes" />
        <KpiCard title="Total Revenue" value={fmt.currency(overview.total_revenue)} icon={<DollarSign size={16}/>} iconBg="#edfaf5" iconColor="#4b9a7c" sub="billing total" />
        <KpiCard title="Average Age" value={patients?.summary?.avg_age == null ? '—' : fmt.number(patients.summary.avg_age) + ' yrs'} icon={<Users size={16}/>} iconBg="#edf6ff" iconColor="#5599e5" sub="patient average" />
        <KpiCard title="Bed Utilization" value={fmt.pct(overview.bed_occupancy_rate)} icon={<BedDouble size={16}/>} iconBg="#fff0f3" iconColor="#d85c72" sub={`${fmt.number(overview.occupied_beds)} occupied`} />
        <KpiCard title="Resources Available" value={fmt.number(overview.available_beds)} icon={<Boxes size={16}/>} iconBg="#f4efff" iconColor="#9275ce" sub="beds available" />
      </div>

      <div className="overview-main-grid mb-4">
        <ChartCard title="Patient Overview" sub="Key patient demographics and trends">
          {patientLoading && patients && <div className="filter-loading" role="status">Updating patient data...</div>}
          {patientLoading && !patients ? <LoadingState message="Loading patient overview..." /> : patientError && !patients ? <ErrorState /> : (
            <div className="patient-overview-body">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={genderData} dataKey="count" nameKey="gender" innerRadius={42} outerRadius={61} paddingAngle={3} stroke="none">
                      {genderData.map((entry, index) => <Cell key={entry.gender} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />)}
                    </Pie>
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="donut-number">{fmt.number(patients.summary.total_patients)}</text>
                    <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle" className="donut-label">Patients</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="gender-legend">
                {genderData.map((entry, index) => {
                  const total = patients.summary.total_patients || 1;
                  return (
                    <div className="legend-row" key={entry.gender}>
                      <span className="legend-swatch" style={{ background: GENDER_COLORS[index % GENDER_COLORS.length] }} />
                      {entry.gender}
                      <strong>{((entry.count / total) * 100).toFixed(1)}%</strong>
                    </div>
                  )
                })}
              </div>
              <div className="mini-age-chart">
                <div className="mini-heading">Age Distribution</div>
                <ResponsiveContainer width="100%" height={92}>
                  <BarChart data={patients.age} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="age_group" tick={{ fontSize: 9, fill: '#8d8585' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8e7add" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Admission Trends" sub="Monthly admission count" action={<label className="chart-pill-select"><span className="sr-only">Admission trend range</span><select aria-label="Admission trend range" value={trendRange} onChange={event => setTrendRange(Number(event.target.value))}>{[6, 9, 12].map(months => <option key={months} value={months}>Last {months} Months</option>)}</select></label>}>
          <ResponsiveContainer width="100%" height={145}>
            <AreaChart data={visibleTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ed6b9c" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="#ed6b9c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8e7add" stopOpacity={0.16}/>
                  <stop offset="95%" stopColor="#8e7add" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee7e7" /><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#8d8585' }} /><YAxis tick={{ fontSize: 9, fill: '#8d8585' }} width={25} /><Tooltip /><Area type="monotone" dataKey="admissions" name="Admissions" stroke="#ed6b9c" fill="url(#admGrad)" strokeWidth={2.5} dot={{ r: 2, fill: '#ed6b9c' }} /><Area type="monotone" dataKey="discharges" name="Discharges" stroke="#8e7add" fill="url(#disGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="overview-bottom-grid">
        <ChartCard title="Geographic & Patient Demand" sub="Patient volume by state and top cities">
          <GeographicMap locations={geography} states={states} compact />
        </ChartCard>
        <ChartCard title="Department Demand" sub="Patient volume by department">
          <div className="demand-list">{topDepartments.map(department => <div className="demand-row" key={department.department}><div className="demand-label"><span>{department.department}</span><strong>{fmt.number(department.admissions)} <small>({((department.admissions / totalDepartmentAdmissions) * 100).toFixed(1)}%)</small></strong></div><div className="demand-track"><span style={{ width: `${(department.admissions / demandMax) * 100}%` }} /></div></div>)}</div>
        </ChartCard>
        <ChartCard title="High Demand Areas" sub="Key insights from current data">
          <div className="high-demand-list">{highDemand.map(item => <div className="high-demand-row" key={item.label}><span className="high-demand-icon">{item.icon}</span><div><strong>{item.value}</strong><small>{item.label} · {item.sub}</small></div><ArrowUpRight size={14} /></div>)}</div>
        </ChartCard>
      </div>
    </div>
  )
}
