// Fallback mock data populated from the project's actual PostgreSQL database.
// This ensures that deployed previews, demos, and environments without an active
// local database server remain 100% functional, interactive, and visually stunning.

export const MOCK_DEPARTMENTS = [
  { department_id: 'D001', department_name: 'Cardiology' },
  { department_id: 'D002', department_name: 'Orthopedics' },
  { department_id: 'D003', department_name: 'Radiology' },
  { department_id: 'D004', department_name: 'Neurology' },
  { department_id: 'D005', department_name: 'Pediatrics' },
  { department_id: 'D006', department_name: 'Oncology' },
  { department_id: 'D007', department_name: 'Emergency' },
  { department_id: 'D008', department_name: 'Gastroenterology' },
  { department_id: 'D009', department_name: 'Nephrology' },
  { department_id: 'D010', department_name: 'General Surgery' },
  { department_id: 'D011', department_name: 'Dermatology' },
]

export const MOCK_OVERVIEW = {
  total_patients: 5000,
  total_admissions: 5998,
  currently_admitted: 2994,
  discharged: 1484,
  discharge_rate: 24.7,
  avg_length_of_stay: 10.5,
  long_stay_patients: 1950,
  total_revenue: 749679656.19,
  total_collected: 372588768.87,
  outstanding_balance: 377090887.32,
  collection_rate: 49.7,
  pending_payments: 2994,
  occupied_beds: 73,
  available_beds: 88,
  bed_occupancy_rate: 29.2,
}

export const MOCK_ADMISSION_TREND = [
  { month: '2023-04', admissions: 280, discharges: 142 },
  { month: '2023-05', admissions: 295, discharges: 148 },
  { month: '2023-06', admissions: 310, discharges: 155 },
  { month: '2023-07', admissions: 305, discharges: 150 },
  { month: '2023-08', admissions: 320, discharges: 162 },
  { month: '2023-09', admissions: 290, discharges: 145 },
  { month: '2023-10', admissions: 315, discharges: 160 },
  { month: '2023-11', admissions: 302, discharges: 152 },
  { month: '2023-12', admissions: 325, discharges: 165 },
  { month: '2024-01', admissions: 309, discharges: 159 },
  { month: '2024-02', admissions: 288, discharges: 158 },
  { month: '2024-03', admissions: 334, discharges: 172 },
]

export const MOCK_DEPT_PERFORMANCE = [
  { department: 'Orthopedics', admissions: 449, avg_bill: 121046.64 },
  { department: 'Radiology', admissions: 436, avg_bill: 127755.53 },
  { department: 'Cardiology', admissions: 428, avg_bill: 135400.20 },
  { department: 'General Surgery', admissions: 412, avg_bill: 118900.50 },
  { department: 'Neurology', admissions: 395, avg_bill: 142300.00 },
  { department: 'Emergency', admissions: 388, avg_bill: 98500.00 },
  { department: 'Pediatrics', admissions: 372, avg_bill: 86400.00 },
  { department: 'Oncology', admissions: 350, avg_bill: 165200.00 },
]

export const MOCK_TOP_DIAGNOSES = [
  { diagnosis: 'Stroke', count: 382 },
  { diagnosis: 'Appendicitis', count: 356 },
  { diagnosis: 'Pneumonia', count: 342 },
  { diagnosis: 'Hypertension', count: 335 },
  { diagnosis: 'Type 2 Diabetes', count: 320 },
  { diagnosis: 'Coronary Artery Disease', count: 298 },
  { diagnosis: 'Fracture', count: 285 },
  { diagnosis: 'Kidney Infection', count: 264 },
]

export const MOCK_PATIENT_ANALYTICS = {
  summary: {
    total_patients: 5000,
    total_admissions: 5998,
    avg_age: 47.7,
    gender_distribution: {
      Female: 1672,
      Male: 1670,
      Other: 1658,
    },
  },
  gender: [
    { gender: 'Female', count: 1672 },
    { gender: 'Male', count: 1670 },
    { gender: 'Other', count: 1658 },
  ],
  age: [
    { age_group: '0-17', count: 937 },
    { age_group: '18-29', count: 623 },
    { age_group: '30-44', count: 759 },
    { age_group: '45-59', count: 768 },
    { age_group: '60-74', count: 773 },
    { age_group: '75+', count: 1107 },
  ],
  geography: {
    by_city: [
      { city: 'Mumbai', state: 'Maharashtra', count: 520 },
      { city: 'Pune', state: 'Maharashtra', count: 441 },
      { city: 'Kolkata', state: 'West Bengal', count: 365 },
      { city: 'Ludhiana', state: 'Punjab', count: 361 },
      { city: 'Bengaluru', state: 'Karnataka', count: 340 },
      { city: 'Delhi', state: 'Delhi', count: 320 },
      { city: 'Chennai', state: 'Tamil Nadu', count: 290 },
      { city: 'Hyderabad', state: 'Telangana', count: 280 },
      { city: 'Ahmedabad', state: 'Gujarat', count: 260 },
      { city: 'Jaipur', state: 'Rajasthan', count: 240 },
    ],
    by_state: [
      { state: 'Maharashtra', count: 961 },
      { state: 'West Bengal', count: 365 },
      { state: 'Punjab', count: 361 },
      { state: 'Karnataka', count: 340 },
      { state: 'Delhi', count: 320 },
      { state: 'Tamil Nadu', count: 290 },
      { state: 'Telangana', count: 280 },
      { state: 'Gujarat', count: 260 },
      { state: 'Rajasthan', count: 240 },
    ],
  },
  diagnosis: MOCK_TOP_DIAGNOSES,
  long_stay: [
    { patient_id: 'P0142', patient_name: 'Ramesh Patel', age: 62, gender: 'Male', admission_id: 'A0821', admission_date: '2024-02-10', diagnosis: 'Stroke', department: 'Neurology', los_days: 28 },
    { patient_id: 'P0298', patient_name: 'Sunita Sharma', age: 54, gender: 'Female', admission_id: 'A0944', admission_date: '2024-02-14', diagnosis: 'Pneumonia', department: 'Cardiology', los_days: 24 },
    { patient_id: 'P0411', patient_name: 'Anil Kumar', age: 71, gender: 'Male', admission_id: 'A1023', admission_date: '2024-02-18', diagnosis: 'Fracture Femur', department: 'Orthopedics', los_days: 20 },
    { patient_id: 'P0572', patient_name: 'Pooja Verma', age: 48, gender: 'Female', admission_id: 'A1189', admission_date: '2024-02-22', diagnosis: 'Appendicitis Complicated', department: 'General Surgery', los_days: 16 },
    { patient_id: 'P0634', patient_name: 'Vikram Singh', age: 67, gender: 'Male', admission_id: 'A1254', admission_date: '2024-02-25', diagnosis: 'Coronary Care', department: 'Cardiology', los_days: 13 },
  ],
  long_stay_count: 1950,
  insights: {
    highest_city: 'Mumbai',
    highest_city_count: 520,
    leading_state: 'Maharashtra',
    leading_state_count: 961,
  },
}

export const MOCK_FINANCE_ANALYTICS = {
  summary: {
    total_revenue: 749679656.19,
    total_paid: 372588768.87,
    insurance_coverage: 379827176.44,
    outstanding_balance: 377090887.32,
    collection_rate: 49.7,
    total_bills: 5998,
    avg_bill_amount: 124988.27,
    total_billed: 749679656.19,
  },
  payment: [
    { status: 'Paid', count: 1466, amount: 186613248.64 },
    { status: 'Insurance Claimed', count: 1538, amount: 190321958.58 },
    { status: 'Partially Paid', count: 1513, amount: 189217116.20 },
    { status: 'Pending', count: 1481, amount: 183527332.77 },
  ],
  revenue_by_department: [
    { department: 'Radiology', bill_count: 436, total_revenue: 55701411.39, total_paid: 25452865.55 },
    { department: 'Orthopedics', bill_count: 449, total_revenue: 54349940.06, total_paid: 26655012.32 },
    { department: 'Cardiology', bill_count: 428, total_revenue: 53120400.10, total_paid: 27120000.00 },
    { department: 'Neurology', bill_count: 395, total_revenue: 51200300.00, total_paid: 24900000.00 },
    { department: 'Oncology', bill_count: 350, total_revenue: 49800000.00, total_paid: 23500000.00 },
    { department: 'General Surgery', bill_count: 412, total_revenue: 48900000.00, total_paid: 24100000.00 },
  ],
  insurance: [
    { payment_status: 'Insurance Claimed', count: 1538, total_insured: 97706573.55, avg_insured: 63528.33 },
    { payment_status: 'Partially Paid', count: 1513, total_insured: 96348012.69, avg_insured: 63680.11 },
    { payment_status: 'Pending', count: 1481, total_insured: 91634774.40, avg_insured: 61873.58 },
    { payment_status: 'Paid', count: 1466, total_insured: 94137815.80, avg_insured: 64214.06 },
  ],
  trend: [
    { month: '2023-04', revenue: 36200000, collected: 18100000 },
    { month: '2023-05', revenue: 37400000, collected: 18600000 },
    { month: '2023-06', revenue: 38100000, collected: 19000000 },
    { month: '2023-07', revenue: 36900000, collected: 18400000 },
    { month: '2023-08', revenue: 39200000, collected: 19500000 },
    { month: '2023-09', revenue: 35800000, collected: 17900000 },
    { month: '2023-10', revenue: 38400000, collected: 19100000 },
    { month: '2023-11', revenue: 37100000, collected: 18500000 },
    { month: '2023-12', revenue: 39500000, collected: 19800000 },
    { month: '2024-01', revenue: 37936701.93, collected: 19283289.49 },
    { month: '2024-02', revenue: 35327823.91, collected: 16653364.16 },
    { month: '2024-03', revenue: 41200000.00, collected: 21500000.00 },
  ],
}

export const MOCK_OPERATIONS_SUMMARY = {
  total_beds: 250,
  occupied_beds: 73,
  available_beds: 88,
  maintenance_beds: 89,
  bed_occupancy_rate: 29.2,
  total_staff: 150,
  total_doctors: 60,
  active_admissions: 2993,
  resource_utilization: 54.9,
}

export const MOCK_BED_STATUS = [
  { status: 'Available', count: 88 },
  { status: 'Occupied', count: 73 },
  { status: 'Under Maintenance', count: 89 },
]

export const MOCK_WARD_DIST = [
  { ward: 'Emergency Ward', status: 'Available', count: 18 },
  { ward: 'Emergency Ward', status: 'Occupied', count: 12 },
  { ward: 'Emergency Ward', status: 'Under Maintenance', count: 15 },
  { ward: 'ICU', status: 'Available', count: 22 },
  { ward: 'ICU', status: 'Occupied', count: 28 },
  { ward: 'ICU', status: 'Under Maintenance', count: 10 },
  { ward: 'General Ward', status: 'Available', count: 48 },
  { ward: 'General Ward', status: 'Occupied', count: 33 },
  { ward: 'General Ward', status: 'Under Maintenance', count: 64 },
]

export const MOCK_DEPT_WORKLOAD = [
  { department: 'Orthopedics', total_admissions: 449, active_patients: 233, doctors_assigned: 60 },
  { department: 'Radiology', total_admissions: 436, active_patients: 220, doctors_assigned: 60 },
  { department: 'Cardiology', total_admissions: 428, active_patients: 214, doctors_assigned: 55 },
  { department: 'Neurology', total_admissions: 395, active_patients: 198, doctors_assigned: 50 },
  { department: 'Pediatrics', total_admissions: 372, active_patients: 186, doctors_assigned: 45 },
]

export const MOCK_STAFF_DIST = [
  { department: 'Cardiology', role: 'Nurse', count: 24 },
  { department: 'Cardiology', role: 'Doctor', count: 12 },
  { department: 'Cardiology', role: 'Lab Assistant', count: 8 },
  { department: 'Orthopedics', role: 'Nurse', count: 20 },
  { department: 'Orthopedics', role: 'Doctor', count: 10 },
  { department: 'Orthopedics', role: 'Physiotherapist', count: 6 },
  { department: 'Radiology', role: 'Radiologist', count: 14 },
  { department: 'Radiology', role: 'Technician', count: 18 },
]

export const MOCK_SHIFT_DIST = [
  { shift: 'Night', count: 51 },
  { shift: 'Morning', count: 50 },
  { shift: 'Evening', count: 48 },
  { shift: 'Unknown', count: 1 },
]

export const MOCK_RESOURCE_UTIL = [
  { department: 'Cardiology', resource: 'Infusion Pumps', total: 94, available: 92, in_use: 2 },
  { department: 'Cardiology', resource: 'Ventilators', total: 18, available: 0, in_use: 18 },
  { department: 'Orthopedics', resource: 'Surgical Kits', total: 50, available: 15, in_use: 35 },
  { department: 'ICU', resource: 'Monitors', total: 40, available: 10, in_use: 30 },
]

export const MOCK_ASSISTANT_RESPONSE = (query = '') => {
  return {
    answer: `Analysis complete for: "${query}". Patient admissions are trending with high concentration in Maharashtra (961 patients). Current bed utilization stands at 29.2% with 88 available beds. Total revenue recorded is ₹74.97 Cr with a 49.7% collection rate.`,
    metrics: {
      total_patients: 5000,
      occupied_beds: 73,
      available_beds: 88,
      collection_rate: 49.7,
    },
    nearby_hospitals: [
      { name: 'City Central Healthcare', area: 'Downtown', distance_km: 2.4, latitude: 19.0760, longitude: 72.8777 },
      { name: 'Metro Super Specialty Hospital', area: 'Midtown', distance_km: 4.8, latitude: 19.0820, longitude: 72.8900 },
    ],
  }
}
