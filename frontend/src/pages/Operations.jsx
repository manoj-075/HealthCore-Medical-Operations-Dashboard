import { useEffect, useState } from 'react'
import { BedDouble, Users, Activity, Boxes, Filter, RotateCcw, Clock } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import { LoadingState, ErrorState } from '../components/States'
import { getDepartments, getOpsSummary, getBedStatus, getDeptWorkload, getStaffDist, getShiftDist, getResourceUtil } from '../services/api'
import { fmt, COLORS, CHART_COLORS } from '../utils/formatters'

const BED_COLORS = { Available: '#45a282', Occupied: '#6aa9c9', 'Under Maintenance': '#ca9152' }
const SHIFT_COLORS = { Morning: '#ca9152', Evening: '#6aa9c9', Night: '#8b7ad4', Unknown: '#9aacbd' }

export default function Operations() {
  const [summary, setSummary] = useState(null)
  const [beds, setBeds] = useState([])
  const [workload, setWorkload] = useState([])
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [resources, setResources] = useState([])
  const [departments, setDepartments] = useState([])

  const [departmentId, setDepartmentId] = useState('')
  const [bedStatusFilter, setBedStatusFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      getOpsSummary(), getBedStatus(), getDeptWorkload(),
      getStaffDist(), getShiftDist(), getResourceUtil(), getDepartments()
    ])
      .then(([s, b, wl, st, sh, r, d]) => {
        setSummary(s.data); setBeds(b.data); setWorkload(wl.data)
        setStaff(st.data); setShifts(sh.data); setResources(r.data); setDepartments(d.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const hasActiveFilters = Boolean(departmentId || bedStatusFilter || shiftFilter)

  const clearFilters = () => {
    setDepartmentId('')
    setBedStatusFilter('')
    setShiftFilter('')
  }

  if (loading) return <LoadingState />
  if (error || !summary) return <ErrorState />

  const department = departments.find(item => item.department_id === departmentId)
  const name = department?.department_name

  const scopedWorkload = departmentId ? workload.filter(row => row.department === name) : workload
  const scopedStaff = departmentId ? staff.filter(row => row.department === name) : staff
  const scopedResources = departmentId ? resources.filter(row => row.department === name) : resources

  const visibleBeds = bedStatusFilter ? beds.filter(row => row.status === bedStatusFilter) : beds
  const visibleShifts = shiftFilter ? shifts.filter(row => row.shift === shiftFilter) : shifts

  const staffMap = scopedStaff.reduce((map, row) => { map[row.department] = (map[row.department] || 0) + row.count; return map }, {})
  const staffData = Object.entries(staffMap).map(([departmentName, count]) => ({ department: departmentName, count })).sort((a, b) => b.count - a.count)

  const resourceData = Object.values(scopedResources.reduce((map, row) => {
    if (!map[row.department]) map[row.department] = { department: row.department, total: 0, available: 0, in_use: 0 }
    map[row.department].total += Number(row.total || 0)
    map[row.department].available += Number(row.available || 0)
    map[row.department].in_use += Number(row.in_use || 0)
    return map
  }, {})).sort((a, b) => b.available - a.available)

  const resourceTotal = resourceData.reduce((total, row) => total + row.available, 0)
  const scopedStaffTotal = staffData.reduce((total, row) => total + row.count, 0)
  const demandMax = Math.max(...scopedWorkload.map(row => row.total_admissions), 1)
  const topWorkload = [...scopedWorkload].sort((a, b) => b.total_admissions - a.total_admissions)
  const topUtilization = [...resourceData].sort((a, b) => (b.in_use / (b.total || 1)) - (a.in_use / (a.total || 1)))[0]
  const topStaff = staffData[0]

  const insights = [
    topUtilization && { value: topUtilization.department, label: 'Highest resource utilization', sub: `${fmt.pct(topUtilization.total ? (topUtilization.in_use / topUtilization.total) * 100 : 0)}` },
    topWorkload[0] && { value: topWorkload[0].department, label: 'Highest admission demand', sub: `${fmt.number(topWorkload[0].total_admissions)} admissions` },
    topStaff && { value: topStaff.department, label: 'Largest staffing concentration', sub: `${fmt.number(topStaff.count)} staff members` },
  ].filter(Boolean)

  return (
    <div className="operations-page">
      <div className="filter-bar operations-filter-bar mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div className="filter-heading"><Filter size={15} /> Operational filters</div>
        <label>Department
          <select value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label>Bed Status
          <select value={bedStatusFilter} onChange={event => setBedStatusFilter(event.target.value)}>
            <option value="">All bed statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </label>
        <label>Staff Shift
          <select value={shiftFilter} onChange={event => setShiftFilter(event.target.value)}>
            <option value="">All shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
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

      <div className="kpi-grid operations-kpis mb-4">
        <KpiCard title="Total Beds" value={fmt.number(summary.total_beds)} icon={<BedDouble size={16}/>} iconBg="#eff6ff" iconColor="#2563eb" sub="hospital beds" />
        <KpiCard title="Occupancy Rate" value={fmt.pct(summary.bed_occupancy_rate)} icon={<Activity size={16}/>} iconBg="#fff1f5" iconColor="#d85d7a" sub={`${fmt.number(summary.occupied_beds)} occupied`} />
        <KpiCard title="Total Staff" value={fmt.number(scopedStaffTotal || summary.total_staff)} icon={<Users size={16}/>} iconBg="#f0fdf4" iconColor="#16a34a" sub="healthcare staff" />
        <KpiCard title="Doctors" value={fmt.number(summary.total_doctors)} icon={<Users size={16}/>} iconBg="#faf5ff" iconColor="#7c3aed" sub="physicians" />
        <KpiCard title="Active Admissions" value={fmt.number(summary.active_admissions)} icon={<Activity size={16}/>} iconBg="#fff7ed" iconColor="#ca9152" sub="in treatment" />
        <KpiCard title="Resources Avail" value={fmt.number(resourceTotal || summary.available_beds)} icon={<Boxes size={16}/>} iconBg="#edf6ff" iconColor="#5599e5" sub={`${summary.resource_utilization}% in use`} />
      </div>

      <div className="operations-main-grid mb-4">
        <ChartCard title="Bed Status Distribution" sub="Total beds by status">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={visibleBeds} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                {visibleBeds.map(entry => (
                  <Cell key={entry.status} fill={BED_COLORS[entry.status] ?? COLORS[0]} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmt.number(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Workload & Admissions" sub="Admissions and active patients per department">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scopedWorkload.slice(0, 6)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee7e7" />
              <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#71849a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71849a' }} width={25} />
              <Tooltip />
              <Bar dataKey="total_admissions" name="Admissions" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
              <Bar dataKey="active_patients" name="Active" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="operations-bottom-grid">
        <ChartCard title="Staff Distribution" sub="Total staff per department">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={staffData.slice(0, 5)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee7e7" />
              <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#71849a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71849a' }} width={25} />
              <Tooltip />
              <Bar dataKey="count" name="Staff" fill={CHART_COLORS.pink} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Resource Availability" sub="Available vs in-use resources">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={resourceData.slice(0, 5)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee7e7" />
              <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#71849a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71849a' }} width={25} />
              <Tooltip />
              <Bar dataKey="available" name="Available" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="in_use" name="In Use" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operational Insights" sub="Key operational metrics">
          <div className="operations-insight-list">
            {insights.map(i => (
              <div className="operations-insight-row" key={i.label}>
                <Activity size={16} style={{ color: 'var(--primary)' }} />
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
