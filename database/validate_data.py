"""Read-only validation for the eight-table PostgreSQL dashboard schema."""
from pathlib import Path
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL is not set in backend/.env")

engine = create_engine(DATABASE_URL)
failures = []


def check(name, count):
    count = int(count or 0)
    status = "PASS" if count == 0 else "FAIL"
    print(f"{status:4} {name}: {count}")
    if count:
        failures.append(name)


with engine.connect() as conn:
    expected_tables = {
        "departments", "patients", "doctors", "staff", "beds",
        "hospital_resources", "admissions", "billing",
    }
    actual_tables = set(conn.execute(text("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    """)).scalars())
    missing_tables = expected_tables - actual_tables
    check("missing required tables", len(missing_tables))

    checks = {
        "duplicate department keys": "SELECT COUNT(*) - COUNT(DISTINCT department_id) FROM departments",
        "duplicate patient keys": "SELECT COUNT(*) - COUNT(DISTINCT patient_id) FROM patients",
        "duplicate doctor keys": "SELECT COUNT(*) - COUNT(DISTINCT doctor_id) FROM doctors",
        "duplicate staff keys": "SELECT COUNT(*) - COUNT(DISTINCT staff_id) FROM staff",
        "duplicate bed keys": "SELECT COUNT(*) - COUNT(DISTINCT bed_id) FROM beds",
        "duplicate resource keys": "SELECT COUNT(*) - COUNT(DISTINCT resource_id) FROM hospital_resources",
        "duplicate admission keys": "SELECT COUNT(*) - COUNT(DISTINCT admission_id) FROM admissions",
        "duplicate billing keys": "SELECT COUNT(*) - COUNT(DISTINCT bill_id) FROM billing",
        "invalid patient ages": "SELECT COUNT(*) FROM patients WHERE age < 0 OR age > 150",
        "invalid doctor experience": "SELECT COUNT(*) FROM doctors WHERE experience_years < 0",
        "invalid resource quantities": "SELECT COUNT(*) FROM hospital_resources WHERE quantity < 0 OR available_quantity < 0 OR available_quantity > quantity",
        "invalid billing amounts": "SELECT COUNT(*) FROM billing WHERE total_amount < 0 OR paid_amount < 0 OR insurance_coverage < 0",
        "invalid admission dates": "SELECT COUNT(*) FROM admissions WHERE discharge_date IS NOT NULL AND discharge_date < admission_date",
        "orphan doctors": "SELECT COUNT(*) FROM doctors d LEFT JOIN departments x ON x.department_id = d.department_id WHERE d.department_id IS NOT NULL AND x.department_id IS NULL",
        "orphan staff": "SELECT COUNT(*) FROM staff s LEFT JOIN departments x ON x.department_id = s.department_id WHERE s.department_id IS NOT NULL AND x.department_id IS NULL",
        "orphan beds": "SELECT COUNT(*) FROM beds b LEFT JOIN departments x ON x.department_id = b.department_id WHERE b.department_id IS NOT NULL AND x.department_id IS NULL",
        "orphan resources": "SELECT COUNT(*) FROM hospital_resources r LEFT JOIN departments x ON x.department_id = r.department_id WHERE r.department_id IS NOT NULL AND x.department_id IS NULL",
        "orphan admissions patients": "SELECT COUNT(*) FROM admissions a LEFT JOIN patients p ON p.patient_id = a.patient_id WHERE p.patient_id IS NULL",
        "orphan admissions departments": "SELECT COUNT(*) FROM admissions a LEFT JOIN departments d ON d.department_id = a.department_id WHERE a.department_id IS NOT NULL AND d.department_id IS NULL",
        "orphan admissions doctors": "SELECT COUNT(*) FROM admissions a LEFT JOIN doctors d ON d.doctor_id = a.doctor_id WHERE a.doctor_id IS NOT NULL AND d.doctor_id IS NULL",
        "orphan admissions beds": "SELECT COUNT(*) FROM admissions a LEFT JOIN beds b ON b.bed_id = a.bed_id WHERE a.bed_id IS NOT NULL AND b.bed_id IS NULL",
        "orphan billing admissions": "SELECT COUNT(*) FROM billing b LEFT JOIN admissions a ON a.admission_id = b.admission_id WHERE a.admission_id IS NULL",
        "billing patient mismatch": "SELECT COUNT(*) FROM billing b JOIN admissions a ON a.admission_id = b.admission_id WHERE a.patient_id <> b.patient_id",
    }
    for name, query in checks.items():
        check(name, conn.execute(text(query)).scalar())

    expected_indexes = {
        "idx_patients_state", "idx_patients_city", "idx_admissions_date",
        "idx_admissions_dept", "idx_billing_status", "idx_resources_dept",
    }
    actual_indexes = set(conn.execute(text("""
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    """)).scalars())
    check("missing required indexes", len(expected_indexes - actual_indexes))

print(f"\nValidation complete: {len(failures)} failing checks")
raise SystemExit(1 if failures else 0)
