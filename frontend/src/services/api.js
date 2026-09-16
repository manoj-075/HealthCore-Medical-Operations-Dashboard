import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''),
  timeout: 15000,
})

// Dashboard
export const getOverview           = () => api.get('/api/dashboard/overview')
export const getAdmissionTrend     = () => api.get('/api/dashboard/admission-trend')
export const getDeptPerformance    = () => api.get('/api/dashboard/department-performance')
export const getTopDiagnoses       = () => api.get('/api/dashboard/top-diagnoses')

// Patients
export const getPatientSummary     = () => api.get('/api/patients/summary')
export const getGenderDist         = () => api.get('/api/patients/gender-distribution')
export const getAgeDist            = () => api.get('/api/patients/age-distribution')
export const getLocationDist       = () => api.get('/api/patients/location-distribution')
export const getGeographicAnalysis = () => api.get('/api/patients/geographic-analysis')
export const getDepartments        = () => api.get('/api/patients/departments')
export const getPatientAnalytics   = (params) => api.get('/api/patients/analytics', { params })
export const getDiagnosisAnalysis  = (params) => api.get('/api/patients/diagnosis-analysis', { params })
export const getLongStay           = (params) => api.get('/api/patients/long-stay', { params })

// Finance
export const getFinanceSummary     = () => api.get('/api/finance/summary')
export const getPaymentStatus      = () => api.get('/api/finance/payment-status')
export const getRevenueByDept      = () => api.get('/api/finance/revenue-by-department')
export const getInsuranceAnalysis  = () => api.get('/api/finance/insurance-analysis')
export const getRevenueTrend       = () => api.get('/api/finance/revenue-trend')
export const getFinanceAnalytics   = (params) => api.get('/api/finance/analytics', { params })

// Operations
export const getOpsSummary         = () => api.get('/api/operations/summary')
export const getBedStatus          = () => api.get('/api/operations/bed-status')
export const getWardDist           = () => api.get('/api/operations/ward-distribution')
export const getDeptWorkload       = () => api.get('/api/operations/department-workload')
export const getStaffDist          = () => api.get('/api/operations/staff-distribution')
export const getShiftDist          = () => api.get('/api/operations/shift-distribution')
export const getResourceUtil       = () => api.get('/api/operations/resource-utilization')

// Assistant
export const askAssistant           = (query, params) => api.post('/api/assistant/query', { query, ...params })
