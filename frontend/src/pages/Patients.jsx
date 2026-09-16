import { useEffect, useState } from 'react'
import { Users, UserCheck, Clock, MapPin, Filter, Activity, RotateCcw } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import GeographicMap from '../components/GeographicMap'
import { LoadingState, ErrorState } from '../components/States'
import { getDepartments, getPatientAnalytics } from '../services/api'
import { fmt, COLORS, CHART_COLORS } from '../utils/formatters'

const GENDER_COLORS = { Female: '#db2777', Male: '#2563eb', Other: '#7c3aed' }

export default function Patients() {
  const [analytics, setAnalytics] = useState(null)
  const [departments, setDepartments] = useState([])
  const [departmentId, setDepartmentId] = useState('')
  const [thresholdDays, setThresholdDays] = useState(7)
  const [gender, setGender] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  
  const [statesList, setStatesList] = useState([])
  const [citiesList, setCitiesList] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDepartments().then(response => setDepartments(response.data)).catch(() => setError(true))
  }, [])

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(false)
    getPatientAnalytics({
      department_id: departmentId || undefined,
      threshold_days: thresholdDays,
      gender: gender || undefined,
      state: state || undefined,
      city: city || undefined,
      age_group: ageGroup || undefined,
    })
      .then(response => {
        if (current) {
          setAnalytics(response.data)
          if (statesList.length === 0 && response.data.geography?.by_state) {
            setStatesList(response.data.geography.by_state.map(s => s.state))
          }
          if (citiesList.length === 0 && response.data.geography?.by_city) {
            setCitiesList(Array.from(new Set(response.data.geography.by_city.map(c => c.city))))
          }
        }
      })
      .catch(() => { if (current) setError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [departmentId, thresholdDays, gender, state, city, ageGroup])

  const hasActiveFilters = Boolean(departmentId || gender || state || city || ageGroup || thresholdDays !== 7)

  const clearFilters = () => {
    setDepartmentId('')
    setThresholdDays(7)
    setGender('')
    setState('')
    setCity('')
    setAgeGroup('')
  }

  if (loading || !analytics) return <LoadingState />
  if (error) return <ErrorState />

  const { summary, gender: genderData, age, geography, diagnosis, long_stay: longStay, long_stay_count: longStayCount, insights } = analytics
  const totalPatients = summary.total_patients || 1

  return (
    <div className="patient-page">
      <div className="filter-bar patient-filter-bar mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div className="filter-heading"><Filter size={15} /> Patient filters</div>
        <label>Department
          <select value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label>Gender
          <select value={gender} onChange={event => setGender(event.target.value)}>
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Age Group
          <select value={ageGroup} onChange={event => setAgeGroup(event.target.value)}>
            <option value="">All age groups</option>
            <option value="0-17">0-17 yrs</option>
            <option value="18-29">18-29 yrs</option>
            <option value="30-44">30-44 yrs</option>
            <option value="45-59">45-59 yrs</option>
            <option value="60-74">60-74 yrs</option>
            <option value="75+">75+ yrs</option>
          </select>
        </label>
        <label>State
          <select value={state} onChange={event => setState(event.target.value)}>
            <option value="">All states</option>
            {statesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>City
          <select value={city} onChange={event => setCity(event.target.value)}>
            <option value="">All cities</option>
            {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Threshold
          <select value={thresholdDays} onChange={event => setThresholdDays(Number(event.target.value))}>
            {[7, 10, 14, 30].map(days => <option key={days} value={days}>{days}+ days</option>)}
          </select>
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

      <div className="kpi-grid patient-kpis mb-4">
        <KpiCard title="Total Patients"  value={fmt.number(summary.total_patients)} icon={<Users size={18}/>}     iconBg="#eff6ff" iconColor="#2563eb" />
        <KpiCard title="Average Age"     value={summary.avg_age ?? '—'}             icon={<UserCheck size={18}/>} iconBg="#f0fdf4" iconColor="#16a34a" sub="years" />
        <KpiCard title="Admissions"      value={fmt.number(summary.total_admissions)} icon={<Activity size={18}/>} iconBg="#f0fdf4" iconColor="#16a34a" />
        <KpiCard title={`Long-Stay (${thresholdDays}+d)`} value={fmt.number(longStayCount)} icon={<Clock size={18}/>} iconBg="#fef2f2" iconColor="#dc2626" sub="matching admissions" />
        <KpiCard title="States Covered"  value={fmt.number(geography.by_state.length)} icon={<MapPin size={18}/>} iconBg="#faf5ff" iconColor="#7c3aed" />
      </div>

      <div className="patient-chart-grid mb-4">
        <ChartCard title="Gender Distribution" sub="Patient breakdown by gender">
          <div className="patient-gender-body">
            <ResponsiveContainer width="42%" height={170}>
              <PieChart>
                <Pie data={genderData} dataKey="count" nameKey="gender" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none">
                  {genderData.map((entry) => (
                    <Cell key={entry.gender} fill={GENDER_COLORS[entry.gender] ?? COLORS[0]} />
                  ))}
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="patient-donut-number">{fmt.number(summary.total_patients)}</text>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="patient-donut-label">Patients</text>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 9, border: '1px solid #dce9f1' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="patient-gender-legend">
              {genderData.map(entry => (
                <div className="patient-legend-row" key={entry.gender}>
                  <span className="legend-swatch" style={{ background: GENDER_COLORS[entry.gender] ?? COLORS[0] }} />
                  {entry.gender}
                  <strong>{fmt.number(entry.count)} <small>{((entry.count / totalPatients) * 100).toFixed(1)}%</small></strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Age Distribution" sub="Patients grouped by age band">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={age} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4eef4" />
              <XAxis dataKey="age_group" tick={{ fontSize: 9, fill: '#71849a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71849a' }} width={26} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 9, border: '1px solid #dce9f1' }} />
              <Bar dataKey="count" name="Patients" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="patient-detail-grid">
        <ChartCard title="Geographic Demand Map" sub="Patient volume by city; select a marker for details">
          <GeographicMap locations={geography.by_city} states={geography.by_state} />
        </ChartCard>

        <ChartCard title="Top Diagnoses" sub="Most common admission diagnoses">
          <div className="patient-location-list">
            {diagnosis.slice(0, 7).map(d => (
              <div className="patient-location-row" key={d.diagnosis}>
                <Activity size={14} style={{ color: 'var(--primary)' }} />
                <div><strong>{d.diagnosis}</strong></div>
                <b>{fmt.number(d.count)} cases</b>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
