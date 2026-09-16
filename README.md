# HealthCore

Healthcare Intelligence & Operations Platform for hospital patient flow, finance, and operations. It connects cleaned PostgreSQL data to a FastAPI service and a React/Vite dashboard.

## Problem and Objectives

Hospital management needs one view of demand, admissions, revenue, beds, staffing, resources, and patient geography. HealthCore cleans the source data, preserves it in a relational model, exposes reusable analytics APIs, and presents decision-ready KPIs, trends, filters, and calculated insights.

## Architecture

```text
CSV cleaning/import -> PostgreSQL -> FastAPI + SQLAlchemy -> React + Recharts
```

- `database/`: schema, import, and read-only data validation
- `backend/app/`: FastAPI application, routers, schemas, and analytics services
- `frontend/src/`: pages, reusable dashboard components, API client, and formatters

## Technology Stack

- PostgreSQL
- Python, FastAPI, SQLAlchemy, Pydantic
- React 18, Vite, Axios, Recharts, lucide-react

## Database Structure

The database contains eight relational tables: `departments`, `patients`, `doctors`, `staff`, `beds`, `hospital_resources`, `admissions`, and `billing`.

Primary keys, foreign keys, checks, and indexes are defined in `database/schema.sql`. Admissions connect patients to departments, doctors, and beds. Billing connects to both the patient and admission and is checked for patient/admission consistency.

## Data Cleaning and Validation

`database/import_data.py` cleans whitespace, duplicate keys, genders, dates, ages, shifts, numeric values, invalid required dates, and orphan billing admissions before import.

Run the non-destructive relational audit after import:

```powershell
python database/validate_data.py
```

The audit checks all eight tables, duplicate keys, age/date/numeric constraints, foreign-key orphans, billing relationships, and required indexes.

## Dashboard Pages

- **Overview**: HealthCore executive KPIs, revenue, collection, outstanding balance, bed occupancy, admission trends, department performance, diagnoses, and calculated recommendations.
- **Patient Intelligence**: filtered patient KPIs, gender and age distributions, diagnoses, long-stay admissions, geographic demand, and calculated insights.
- **Financial Intelligence**: revenue, collected amount, insurance coverage, outstanding balance, payment status, department revenue, insurance analysis, and revenue trends.
- **Operational Intelligence**: beds, occupancy, wards, staff roles and shifts, department workload, and resource utilization.

## Filters, Geography, and Insights

The Patients page uses `GET /api/patients/analytics` with `department_id` and `threshold_days`. Both filters are applied together in the backend to patient scope, admissions, distributions, diagnoses, geographic analysis, long-stay results, and KPI values.

Geographic analysis uses only database `city` and `state` fields. It reports patient volume by state, city-level demand, and the highest-volume locations. Insights such as highest-demand city/state, leading diagnosis, and long-stay volume are calculated from the selected real dataset; no coordinates or fake data are generated.

## API Overview

- `/api/dashboard/*`: overview KPIs, admission trends, department performance, diagnoses
- `/api/patients/*`: patient summaries, distributions, geographic analysis, departments, filtered analytics, and long-stay admissions
- `/api/finance/*`: financial summaries, payment status, insurance, department revenue, trends
- `/api/operations/*`: beds, wards, staff, workload, shifts, and resources
- `/health`: database connectivity check

## Run Locally

### Backend

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

API documentation: `http://127.0.0.1:8000/docs`

### Frontend

```powershell
cd frontend
npm install
npm run dev -- --host localhost --port 5173
```

Dashboard: `http://localhost:5173`

The frontend uses `VITE_API_BASE_URL` from `frontend/.env`, defaulting to `http://127.0.0.1:8000`.

### Database Setup

1. Create a PostgreSQL database named `medops`.
2. Set `DATABASE_URL` in `backend/.env`.
3. Apply `database/schema.sql`.
4. Run `python database/import_data.py` from the repository root.
5. Run `python database/validate_data.py`.

## Testing

```powershell
cd backend
python test_all.py
python test_http.py

cd ..\frontend
npm run build
```

The service script validates analytics functions, the HTTP script validates the existing 24 endpoint checks, and the production build validates the React bundle. Browser verification should cover `/`, `/patients`, `/finance`, and `/operations`, including department and long-stay filter combinations.
