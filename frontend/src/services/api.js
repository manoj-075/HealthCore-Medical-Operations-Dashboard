import axios from 'axios'
import {
  MOCK_DEPARTMENTS,
  MOCK_OVERVIEW,
  MOCK_ADMISSION_TREND,
  MOCK_DEPT_PERFORMANCE,
  MOCK_TOP_DIAGNOSES,
  MOCK_PATIENT_ANALYTICS,
  MOCK_FINANCE_ANALYTICS,
  MOCK_OPERATIONS_SUMMARY,
  MOCK_BED_STATUS,
  MOCK_WARD_DIST,
  MOCK_DEPT_WORKLOAD,
  MOCK_STAFF_DIST,
  MOCK_SHIFT_DIST,
  MOCK_RESOURCE_UTIL,
  MOCK_ASSISTANT_RESPONSE,
} from './mockData'

const rawBaseURL = import.meta.env.VITE_API_BASE_URL
const api = axios.create({
  baseURL: rawBaseURL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''),
  timeout: 8000,
})

// Intercept HTML responses from static hosting rewrite rules (e.g. Vercel SPA rewrites)
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && (response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html'))) {
      return Promise.reject(new Error('Received HTML instead of JSON API response'))
    }
    return response
  },
  (error) => Promise.reject(error)
)

export let isBackendConnected = false
const statusListeners = new Set()

export function subscribeBackendStatus(listener) {
  statusListeners.add(listener)
  listener(isBackendConnected)
  return () => statusListeners.delete(listener)
}

function setBackendStatus(connected) {
  if (isBackendConnected !== connected) {
    isBackendConnected = connected
    statusListeners.forEach(listener => listener(connected))
  }
}

async function safeApiCall(apiFn, fallbackResolver) {
  try {
    const response = await apiFn()
    if (response && response.data && typeof response.data === 'object') {
      setBackendStatus(true)
      return response
    }
    throw new Error('Invalid response structure')
  } catch (err) {
    setBackendStatus(false)
    const fallbackData = typeof fallbackResolver === 'function' ? fallbackResolver() : fallbackResolver
    return { data: fallbackData, isFallback: true }
  }
}

// Dashboard
export const getOverview = () =>
  safeApiCall(() => api.get('/api/dashboard/overview'), MOCK_OVERVIEW)

export const getAdmissionTrend = () =>
  safeApiCall(() => api.get('/api/dashboard/admission-trend'), MOCK_ADMISSION_TREND)

export const getDeptPerformance = () =>
  safeApiCall(() => api.get('/api/dashboard/department-performance'), MOCK_DEPT_PERFORMANCE)

export const getTopDiagnoses = (limit = 10) =>
  safeApiCall(() => api.get('/api/dashboard/top-diagnoses', { params: { limit } }), MOCK_TOP_DIAGNOSES.slice(0, limit))

// Patients
export const getPatientSummary = () =>
  safeApiCall(() => api.get('/api/patients/summary'), MOCK_PATIENT_ANALYTICS.summary)

export const getGenderDist = () =>
  safeApiCall(() => api.get('/api/patients/gender-distribution'), MOCK_PATIENT_ANALYTICS.gender)

export const getAgeDist = () =>
  safeApiCall(() => api.get('/api/patients/age-distribution'), MOCK_PATIENT_ANALYTICS.age)

export const getLocationDist = () =>
  safeApiCall(() => api.get('/api/patients/location-distribution'), MOCK_PATIENT_ANALYTICS.geography.by_state)

export const getGeographicAnalysis = () =>
  safeApiCall(() => api.get('/api/patients/geographic-analysis'), MOCK_PATIENT_ANALYTICS.geography)

export const getDepartments = () =>
  safeApiCall(() => api.get('/api/patients/departments'), MOCK_DEPARTMENTS)

export const getPatientAnalytics = (params = {}) =>
  safeApiCall(
    () => api.get('/api/patients/analytics', { params }),
    () => {
      // Return realistic filtered mock data
      const base = { ...MOCK_PATIENT_ANALYTICS }
      let filteredSummary = { ...base.summary }
      let filteredGender = [...base.gender]
      let filteredAge = [...base.age]
      let filteredGeoCity = [...base.geography.by_city]
      let filteredGeoState = [...base.geography.by_state]
      let filteredLongStay = [...base.long_stay]

      if (params.state) {
        filteredGeoState = filteredGeoState.filter(s => s.state.toLowerCase() === params.state.toLowerCase())
        filteredGeoCity = filteredGeoCity.filter(c => c.state.toLowerCase() === params.state.toLowerCase())
      }
      if (params.city) {
        filteredGeoCity = filteredGeoCity.filter(c => c.city.toLowerCase() === params.city.toLowerCase())
      }
      if (params.gender) {
        filteredGender = filteredGender.filter(g => g.gender.toLowerCase() === params.gender.toLowerCase())
      }
      if (params.department_id) {
        filteredLongStay = filteredLongStay.filter(p => p.department === params.department_id || p.department.includes(params.department_id))
      }
      if (params.threshold_days) {
        filteredLongStay = filteredLongStay.filter(p => p.los_days >= params.threshold_days)
      }

      return {
        summary: filteredSummary,
        gender: filteredGender,
        age: filteredAge,
        geography: {
          by_city: filteredGeoCity,
          by_state: filteredGeoState,
        },
        diagnosis: base.diagnosis,
        long_stay: filteredLongStay,
        long_stay_count: filteredLongStay.length,
        insights: base.insights,
      }
    }
  )

export const getDiagnosisAnalysis = (params) =>
  safeApiCall(() => api.get('/api/patients/diagnosis-analysis', { params }), MOCK_TOP_DIAGNOSES)

export const getLongStay = (params) =>
  safeApiCall(
    () => api.get('/api/patients/long-stay', { params }),
    () => {
      const days = params?.threshold_days || 7
      return MOCK_PATIENT_ANALYTICS.long_stay.filter(p => p.los_days >= days)
    }
  )

// Finance
export const getFinanceSummary = () =>
  safeApiCall(() => api.get('/api/finance/summary'), MOCK_FINANCE_ANALYTICS.summary)

export const getPaymentStatus = () =>
  safeApiCall(() => api.get('/api/finance/payment-status'), MOCK_FINANCE_ANALYTICS.payment)

export const getRevenueByDept = () =>
  safeApiCall(() => api.get('/api/finance/revenue-by-department'), MOCK_FINANCE_ANALYTICS.revenue_by_department)

export const getInsuranceAnalysis = () =>
  safeApiCall(() => api.get('/api/finance/insurance-analysis'), MOCK_FINANCE_ANALYTICS.insurance)

export const getRevenueTrend = () =>
  safeApiCall(() => api.get('/api/finance/revenue-trend'), MOCK_FINANCE_ANALYTICS.trend)

export const getFinanceAnalytics = (params = {}) =>
  safeApiCall(
    () => api.get('/api/finance/analytics', { params }),
    () => {
      let payment = [...MOCK_FINANCE_ANALYTICS.payment]
      let revDept = [...MOCK_FINANCE_ANALYTICS.revenue_by_department]

      if (params.payment_status) {
        payment = payment.filter(p => p.status.toLowerCase() === params.payment_status.toLowerCase())
      }
      if (params.department_id) {
        const dep = MOCK_DEPARTMENTS.find(d => d.department_id === params.department_id)
        if (dep) {
          revDept = revDept.filter(r => r.department.toLowerCase() === dep.department_name.toLowerCase())
        }
      }

      return {
        summary: MOCK_FINANCE_ANALYTICS.summary,
        payment,
        revenue_by_department: revDept,
        insurance: MOCK_FINANCE_ANALYTICS.insurance,
        trend: MOCK_FINANCE_ANALYTICS.trend,
      }
    }
  )

// Operations
export const getOpsSummary = () =>
  safeApiCall(() => api.get('/api/operations/summary'), MOCK_OPERATIONS_SUMMARY)

export const getBedStatus = () =>
  safeApiCall(() => api.get('/api/operations/bed-status'), MOCK_BED_STATUS)

export const getWardDist = () =>
  safeApiCall(() => api.get('/api/operations/ward-distribution'), MOCK_WARD_DIST)

export const getDeptWorkload = () =>
  safeApiCall(() => api.get('/api/operations/department-workload'), MOCK_DEPT_WORKLOAD)

export const getStaffDist = () =>
  safeApiCall(() => api.get('/api/operations/staff-distribution'), MOCK_STAFF_DIST)

export const getShiftDist = () =>
  safeApiCall(() => api.get('/api/operations/shift-distribution'), MOCK_SHIFT_DIST)

export const getResourceUtil = () =>
  safeApiCall(() => api.get('/api/operations/resource-utilization'), MOCK_RESOURCE_UTIL)

// Assistant
export const askAssistant = (query, params = {}) =>
  safeApiCall(
    () => api.post('/api/assistant/query', { query, ...params }),
    () => MOCK_ASSISTANT_RESPONSE(query)
  )

