from collections import defaultdict
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, case, select, text

from app.database.models import (
    Department, Patient, Doctor, Staff,
    Bed, HospitalResource, Admission, Billing,
)


def _d(val):
    """Convert Decimal to float safely."""
    return float(val) if isinstance(val, Decimal) else (val or 0)


# ─── Dashboard / Overview ────────────────────────────────────────────────────

def get_overview(db: Session) -> dict:
    total_patients   = db.query(func.count(Patient.patient_id)).scalar()
    total_admissions = db.query(func.count(Admission.admission_id)).scalar()

    status_counts = dict(
        db.query(Admission.admission_status, func.count())
          .group_by(Admission.admission_status)
          .all()
    )
    currently_admitted = sum(
        v for k, v in status_counts.items()
        if k and k.lower() in ("admitted", "under treatment")
    )
    discharged = status_counts.get("Discharged", 0)
    discharge_rate = round(discharged / total_admissions * 100, 1) if total_admissions else 0

    avg_los_row = db.execute(text(
        "SELECT AVG((discharge_date - admission_date)::float) FROM admissions WHERE discharge_date IS NOT NULL"
    )).scalar()
    avg_los = round(_d(avg_los_row), 1)

    long_stay = db.execute(text(
        "SELECT COUNT(*) FROM admissions WHERE discharge_date IS NOT NULL AND (discharge_date - admission_date) > 7"
    )).scalar()

    fin = db.query(
        func.sum(Billing.total_amount),
        func.sum(Billing.paid_amount),
        func.sum(Billing.insurance_coverage),
    ).first()
    total_revenue   = _d(fin[0])
    total_collected = _d(fin[1])
    insurance_total = _d(fin[2])
    outstanding     = round(total_revenue - total_collected, 2)
    collection_rate = round(total_collected / total_revenue * 100, 1) if total_revenue else 0

    pending_count = db.query(func.count()).filter(
        Billing.payment_status.in_(["Pending", "Partially Paid"])
    ).scalar()

    bed_counts = dict(
        db.query(Bed.bed_status, func.count())
          .group_by(Bed.bed_status)
          .all()
    )
    occupied  = bed_counts.get("Occupied", 0)
    available = bed_counts.get("Available", 0)
    total_beds = sum(bed_counts.values())
    occupancy_rate = round(occupied / total_beds * 100, 1) if total_beds else 0

    return {
        "total_patients":      total_patients,
        "total_admissions":    total_admissions,
        "currently_admitted":  currently_admitted,
        "discharged":          discharged,
        "discharge_rate":      discharge_rate,
        "avg_length_of_stay":  avg_los,
        "long_stay_patients":  long_stay,
        "total_revenue":       round(total_revenue, 2),
        "total_collected":     round(total_collected, 2),
        "outstanding_balance": outstanding,
        "collection_rate":     collection_rate,
        "pending_payments":    pending_count,
        "occupied_beds":       occupied,
        "available_beds":      available,
        "bed_occupancy_rate":  occupancy_rate,
    }


def get_admission_trend(db: Session) -> list:
    rows = db.execute(text("""
        SELECT TO_CHAR(admission_date, 'YYYY-MM') AS month,
               COUNT(*) AS admissions,
               COUNT(discharge_date) AS discharges
        FROM admissions
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": r[0], "admissions": r[1], "discharges": r[2]} for r in rows]


def get_department_performance(db: Session) -> list:
    rows = db.execute(text("""
        SELECT d.department_name,
               COUNT(a.admission_id)  AS admissions,
               ROUND(AVG(b.total_amount)::numeric, 2) AS avg_bill
        FROM departments d
        LEFT JOIN admissions a ON a.department_id = d.department_id
        LEFT JOIN billing    b ON b.admission_id  = a.admission_id
        GROUP BY d.department_name
        ORDER BY admissions DESC
    """)).fetchall()
    return [
        {"department": r[0], "admissions": r[1], "avg_bill": _d(r[2])}
        for r in rows
    ]


def get_top_diagnoses(db: Session, limit: int = 10) -> list:
    rows = (
        db.query(Admission.diagnosis, func.count().label("count"))
          .filter(Admission.diagnosis.isnot(None))
          .group_by(Admission.diagnosis)
          .order_by(func.count().desc())
          .limit(limit)
          .all()
    )
    return [{"diagnosis": r[0], "count": r[1]} for r in rows]


# ─── Patient Analytics ────────────────────────────────────────────────────────

def get_patient_summary(db: Session) -> dict:
    total = db.query(func.count(Patient.patient_id)).scalar()
    gender_dist = dict(
        db.query(Patient.gender, func.count())
          .group_by(Patient.gender).all()
    )
    avg_age = db.query(func.avg(Patient.age)).filter(Patient.age.isnot(None)).scalar()
    return {
        "total_patients": total,
        "avg_age": round(_d(avg_age), 1),
        "gender_distribution": gender_dist,
    }


def get_gender_distribution(db: Session) -> list:
    rows = (
        db.query(Patient.gender, func.count().label("count"))
          .group_by(Patient.gender)
          .order_by(func.count().desc())
          .all()
    )
    return [{"gender": r[0] or "Unknown", "count": r[1]} for r in rows]


def get_age_distribution(db: Session) -> list:
    rows = db.execute(text("""
        SELECT
            CASE
                WHEN age < 18  THEN '0-17'
                WHEN age < 30  THEN '18-29'
                WHEN age < 45  THEN '30-44'
                WHEN age < 60  THEN '45-59'
                WHEN age < 75  THEN '60-74'
                ELSE '75+'
            END AS age_group,
            COUNT(*) AS count
        FROM patients
        WHERE age IS NOT NULL
        GROUP BY age_group
        ORDER BY MIN(age)
    """)).fetchall()
    return [{"age_group": r[0], "count": r[1]} for r in rows]


def get_location_distribution(db: Session) -> list:
    rows = (
        db.query(Patient.state, func.count().label("count"))
          .filter(Patient.state.isnot(None))
          .group_by(Patient.state)
          .order_by(func.count().desc())
          .all()
    )
    return [{"state": r[0], "count": r[1]} for r in rows]


def get_geographic_analysis(db: Session) -> dict:
    state_rows = (
        db.query(Patient.state, func.count().label("count"))
          .filter(Patient.state.isnot(None))
          .group_by(Patient.state)
          .order_by(func.count().desc())
          .all()
    )
    city_rows = (
        db.query(Patient.state, Patient.city, func.count().label("count"))
          .filter(Patient.state.isnot(None), Patient.city.isnot(None))
          .group_by(Patient.state, Patient.city)
          .order_by(func.count().desc())
          .all()
    )
    return {
        "by_state": [{"state": r[0], "count": r[1]} for r in state_rows],
        "by_city": [{"state": r[0], "city": r[1], "count": r[2]} for r in city_rows],
    }


def get_departments(db: Session) -> list:
    rows = db.query(Department.department_id, Department.department_name).order_by(Department.department_name).all()
    return [{"department_id": r[0], "department_name": r[1]} for r in rows]


def get_filtered_patient_analytics(
    db: Session,
    department_id: str = None,
    threshold_days: int = 7,
    gender: str = None,
    state: str = None,
    city: str = None,
    age_group: str = None,
) -> dict:
    threshold_days = max(1, threshold_days)
    
    # Build list of patient filter conditions
    patient_filters = []
    if gender:
        patient_filters.append(Patient.gender == gender)
    if state:
        patient_filters.append(Patient.state == state)
    if city:
        patient_filters.append(Patient.city == city)
    if age_group:
        if age_group == "0-17":
            patient_filters.append(Patient.age < 18)
        elif age_group == "18-29":
            patient_filters.append((Patient.age >= 18) & (Patient.age < 30))
        elif age_group == "30-44":
            patient_filters.append((Patient.age >= 30) & (Patient.age < 45))
        elif age_group == "45-59":
            patient_filters.append((Patient.age >= 45) & (Patient.age < 60))
        elif age_group == "60-74":
            patient_filters.append((Patient.age >= 60) & (Patient.age < 75))
        elif age_group == "75+":
            patient_filters.append(Patient.age >= 75)

    if department_id:
        dept_patient_ids = (
            select(Admission.patient_id)
            .where(Admission.department_id == department_id)
            .distinct()
        )
        patient_filters.append(Patient.patient_id.in_(dept_patient_ids))

    total_patients = db.query(func.count(Patient.patient_id)).filter(*patient_filters).scalar() or 0
    avg_age = db.query(func.avg(Patient.age)).filter(*patient_filters, Patient.age.isnot(None)).scalar()

    gender_rows = (
        db.query(Patient.gender, func.count(Patient.patient_id))
          .filter(*patient_filters)
          .group_by(Patient.gender)
          .order_by(func.count(Patient.patient_id).desc())
          .all()
    )
    age_rows = (
        db.query(
            case(
                (Patient.age < 18, "0-17"),
                (Patient.age < 30, "18-29"),
                (Patient.age < 45, "30-44"),
                (Patient.age < 60, "45-59"),
                (Patient.age < 75, "60-74"),
                else_="75+",
            ).label("age_group"),
            func.count(Patient.patient_id),
        )
        .filter(*patient_filters, Patient.age.isnot(None))
        .group_by("age_group")
        .order_by("age_group")
        .all()
    )
    state_rows = (
        db.query(Patient.state, func.count(Patient.patient_id))
          .filter(*patient_filters, Patient.state.isnot(None))
          .group_by(Patient.state)
          .order_by(func.count(Patient.patient_id).desc())
          .all()
    )
    city_rows = (
        db.query(Patient.state, Patient.city, func.count(Patient.patient_id))
          .filter(*patient_filters, Patient.state.isnot(None), Patient.city.isnot(None))
          .group_by(Patient.state, Patient.city)
          .order_by(func.count(Patient.patient_id).desc())
          .all()
    )

    admission_scope = db.query(Admission)
    if department_id:
        admission_scope = admission_scope.filter(Admission.department_id == department_id)
    if gender or state or city or age_group:
        filtered_patient_ids = db.query(Patient.patient_id).filter(*patient_filters)
        admission_scope = admission_scope.filter(Admission.patient_id.in_(filtered_patient_ids))

    diagnosis_query = (
        db.query(Admission.diagnosis, func.count(Admission.admission_id))
          .filter(Admission.diagnosis.isnot(None))
    )
    if department_id:
        diagnosis_query = diagnosis_query.filter(Admission.department_id == department_id)
    if gender or state or city or age_group:
        filtered_patient_ids = db.query(Patient.patient_id).filter(*patient_filters)
        diagnosis_query = diagnosis_query.filter(Admission.patient_id.in_(filtered_patient_ids))

    diagnosis_rows = (
        diagnosis_query.group_by(Admission.diagnosis)
          .order_by(func.count(Admission.admission_id).desc())
          .limit(20)
          .all()
    )
    admission_count = admission_scope.with_entities(func.count(Admission.admission_id)).scalar() or 0
    long_stay = get_long_stay_patients(db, threshold_days, department_id=department_id)
    long_stay_count_query = db.query(func.count(Admission.admission_id)).filter(
        (func.coalesce(Admission.discharge_date, func.current_date()) - Admission.admission_date) > threshold_days
    )
    if department_id:
        long_stay_count_query = long_stay_count_query.filter(Admission.department_id == department_id)
    if gender or state or city or age_group:
        filtered_patient_ids = db.query(Patient.patient_id).filter(*patient_filters)
        long_stay_count_query = long_stay_count_query.filter(Admission.patient_id.in_(filtered_patient_ids))

    long_stay_count = long_stay_count_query.scalar() or 0

    top_city = city_rows[0] if city_rows else None
    top_state = state_rows[0] if state_rows else None
    insights = []
    if top_city:
        insights.append(f"{top_city[1]} has the highest patient volume with {top_city[2]:,} patients.")
    if top_state:
        insights.append(f"{top_state[0]} is the highest-demand state with {top_state[1]:,} patients.")
    if diagnosis_rows:
        insights.append(f"{diagnosis_rows[0][0]} is the most frequent diagnosis with {diagnosis_rows[0][1]:,} admissions.")
    insights.append(f"{long_stay_count:,} admissions exceed the selected {threshold_days}-day stay threshold.")

    return {
        "summary": {
            "total_patients": total_patients,
            "avg_age": round(_d(avg_age), 1) if avg_age is not None else 0,
            "total_admissions": admission_count,
        },
        "gender": [{"gender": row[0] or "Unknown", "count": row[1]} for row in gender_rows],
        "age": [{"age_group": row[0], "count": row[1]} for row in age_rows],
        "geography": {
            "by_state": [{"state": row[0], "count": row[1]} for row in state_rows],
            "by_city": [{"state": row[0], "city": row[1], "count": row[2]} for row in city_rows],
        },
        "diagnosis": [{"diagnosis": row[0], "count": row[1]} for row in diagnosis_rows],
        "long_stay": long_stay,
        "long_stay_count": long_stay_count,
        "insights": insights,
        "filters": {
            "department_id": department_id,
            "threshold_days": threshold_days,
            "gender": gender,
            "state": state,
            "city": city,
            "age_group": age_group,
        },
    }


def get_diagnosis_analysis(db: Session, department_id: str = None) -> list:
    q = (
        db.query(Admission.diagnosis, func.count().label("count"))
          .filter(Admission.diagnosis.isnot(None))
    )
    if department_id:
        q = q.filter(Admission.department_id == department_id)
    rows = q.group_by(Admission.diagnosis).order_by(func.count().desc()).limit(20).all()
    return [{"diagnosis": r[0], "count": r[1]} for r in rows]


def get_long_stay_patients(db: Session, threshold_days: int = 7, department_id: str = None) -> list:
    department_filter = "AND a.department_id = :department_id" if department_id else ""
    query = """
        SELECT p.patient_id, p.patient_name, p.age, p.gender,
               a.admission_id, a.admission_date, a.discharge_date,
               a.diagnosis, d.department_name,
               (COALESCE(a.discharge_date, CURRENT_DATE) - a.admission_date)::int AS los_days
        FROM admissions a
        JOIN patients    p ON p.patient_id    = a.patient_id
        LEFT JOIN departments d ON d.department_id = a.department_id
        WHERE (COALESCE(a.discharge_date, CURRENT_DATE) - a.admission_date) > :threshold
        {department_filter}
        ORDER BY los_days DESC
        LIMIT 100
    """.format(department_filter=department_filter)
    rows = db.execute(
        text(query),
        {"threshold": threshold_days, "department_id": department_id},
    ).fetchall()
    return [
        {
            "patient_id":    r[0], "patient_name": r[1],
            "age":           r[2], "gender":       r[3],
            "admission_id":  r[4],
            "admission_date": str(r[5]) if r[5] else None,
            "discharge_date": str(r[6]) if r[6] else None,
            "diagnosis":     r[7], "department":   r[8],
            "los_days":      r[9],
        }
        for r in rows
    ]


# ─── Financial Analytics ─────────────────────────────────────────────────────

def get_finance_analytics(
    db: Session, department_id: str = None, payment_status: str = None,
    insured: bool = None, min_amount: float = None, max_amount: float = None,
    start_date: str = None, end_date: str = None,
) -> dict:
    """Return every finance widget from one consistently filtered bill set."""
    query = (db.query(Billing, Admission, Department)
             .join(Admission, Billing.admission_id == Admission.admission_id)
             .outerjoin(Department, Admission.department_id == Department.department_id))
    if department_id:
        query = query.filter(Admission.department_id == department_id)
    if payment_status:
        query = query.filter(Billing.payment_status == payment_status)
    if insured is True:
        query = query.filter(func.coalesce(Billing.insurance_coverage, 0) > 0)
    elif insured is False:
        query = query.filter(func.coalesce(Billing.insurance_coverage, 0) <= 0)
    if min_amount is not None:
        query = query.filter(Billing.total_amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Billing.total_amount <= max_amount)
    if start_date:
        query = query.filter(Admission.admission_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Admission.admission_date <= date.fromisoformat(end_date))

    rows = query.all()
    total = sum(_d(bill.total_amount) for bill, _, _ in rows)
    paid = sum(_d(bill.paid_amount) for bill, _, _ in rows)
    insured_total = sum(_d(bill.insurance_coverage) for bill, _, _ in rows)
    count = len(rows)
    statuses = defaultdict(lambda: {"count": 0, "amount": 0.0})
    departments = defaultdict(lambda: {"bill_count": 0, "total_revenue": 0.0, "total_paid": 0.0})
    insurance = defaultdict(lambda: {"count": 0, "total_insured": 0.0})
    trend = defaultdict(lambda: {"revenue": 0.0, "collected": 0.0})
    for bill, admission, department in rows:
        status = bill.payment_status or "Unknown"
        amount, paid_amount, coverage = _d(bill.total_amount), _d(bill.paid_amount), _d(bill.insurance_coverage)
        statuses[status]["count"] += 1; statuses[status]["amount"] += amount
        department_name = department.department_name if department else "Unassigned"
        departments[department_name]["bill_count"] += 1
        departments[department_name]["total_revenue"] += amount
        departments[department_name]["total_paid"] += paid_amount
        insurance[status]["count"] += 1; insurance[status]["total_insured"] += coverage
        month = admission.admission_date.strftime("%Y-%m")
        trend[month]["revenue"] += amount; trend[month]["collected"] += paid_amount

    return {
        "summary": {"total_revenue": round(total, 2), "total_paid": round(paid, 2), "insurance_coverage": round(insured_total, 2), "outstanding_balance": round(total - paid, 2), "collection_rate": round(paid / total * 100, 1) if total else 0, "total_bills": count, "avg_bill_amount": round(total / count, 2) if count else 0},
        "payment": [{"status": status, "count": values["count"], "amount": round(values["amount"], 2)} for status, values in statuses.items()],
        "revenue_by_department": [{"department": name, "bill_count": values["bill_count"], "total_revenue": round(values["total_revenue"], 2), "total_paid": round(values["total_paid"], 2)} for name, values in sorted(departments.items(), key=lambda item: item[1]["total_revenue"], reverse=True)],
        "insurance": [{"payment_status": status, "count": values["count"], "total_insured": round(values["total_insured"], 2), "avg_insured": round(values["total_insured"] / values["count"], 2) if values["count"] else 0} for status, values in insurance.items()],
        "trend": [{"month": month, "revenue": round(values["revenue"], 2), "collected": round(values["collected"], 2)} for month, values in sorted(trend.items())],
    }


def get_finance_summary(db: Session) -> dict:
    fin = db.query(
        func.sum(Billing.total_amount),
        func.sum(Billing.paid_amount),
        func.sum(Billing.insurance_coverage),
        func.count(Billing.bill_id),
    ).first()
    total   = _d(fin[0])
    paid    = _d(fin[1])
    insured = _d(fin[2])
    count   = fin[3]
    outstanding     = round(total - paid, 2)
    collection_rate = round(paid / total * 100, 1) if total else 0
    return {
        "total_revenue":       round(total, 2),
        "total_paid":          round(paid, 2),
        "insurance_coverage":  round(insured, 2),
        "outstanding_balance": outstanding,
        "collection_rate":     collection_rate,
        "total_bills":         count,
        "avg_bill_amount":     round(total / count, 2) if count else 0,
    }


def get_payment_status(db: Session) -> list:
    rows = (
        db.query(Billing.payment_status, func.count().label("count"),
                 func.sum(Billing.total_amount).label("amount"))
          .group_by(Billing.payment_status)
          .all()
    )
    return [
        {"status": r[0] or "Unknown", "count": r[1], "amount": round(_d(r[2]), 2)}
        for r in rows
    ]


def get_revenue_by_department(db: Session) -> list:
    rows = db.execute(text("""
        SELECT d.department_name,
               COUNT(b.bill_id)                        AS bill_count,
               ROUND(SUM(b.total_amount)::numeric, 2)  AS total_revenue,
               ROUND(SUM(b.paid_amount)::numeric, 2)   AS total_paid
        FROM billing b
        JOIN admissions  a ON a.admission_id  = b.admission_id
        JOIN departments d ON d.department_id = a.department_id
        GROUP BY d.department_name
        ORDER BY total_revenue DESC
    """)).fetchall()
    return [
        {
            "department":    r[0], "bill_count": r[1],
            "total_revenue": _d(r[2]), "total_paid": _d(r[3]),
        }
        for r in rows
    ]


def get_insurance_analysis(db: Session) -> list:
    rows = db.execute(text("""
        SELECT payment_status,
               COUNT(*)                                        AS count,
               ROUND(SUM(insurance_coverage)::numeric, 2)     AS total_insured,
               ROUND(AVG(insurance_coverage)::numeric, 2)     AS avg_insured
        FROM billing
        GROUP BY payment_status
        ORDER BY count DESC
    """)).fetchall()
    return [
        {
            "payment_status": r[0], "count": r[1],
            "total_insured":  _d(r[2]), "avg_insured": _d(r[3]),
        }
        for r in rows
    ]


def get_revenue_trend(db: Session) -> list:
    rows = db.execute(text("""
        SELECT TO_CHAR(a.admission_date, 'YYYY-MM') AS month,
               ROUND(SUM(b.total_amount)::numeric, 2) AS revenue,
               ROUND(SUM(b.paid_amount)::numeric, 2)  AS collected
        FROM billing b
        JOIN admissions a ON a.admission_id = b.admission_id
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": r[0], "revenue": _d(r[1]), "collected": _d(r[2])} for r in rows]


# ─── Operations Analytics ────────────────────────────────────────────────────

def get_operations_summary(db: Session) -> dict:
    bed_counts = dict(
        db.query(Bed.bed_status, func.count()).group_by(Bed.bed_status).all()
    )
    total_beds = sum(bed_counts.values())
    occupied   = bed_counts.get("Occupied", 0)

    total_staff   = db.query(func.count(Staff.staff_id)).scalar()
    total_doctors = db.query(func.count(Doctor.doctor_id)).scalar()

    res = db.query(
        func.sum(HospitalResource.quantity),
        func.sum(HospitalResource.available_quantity),
    ).first()
    total_qty = res[0] or 0
    avail_qty = res[1] or 0
    util_rate = round((total_qty - avail_qty) / total_qty * 100, 1) if total_qty else 0

    active_admissions = db.query(func.count()).filter(
        Admission.admission_status.in_(["Admitted", "Under Treatment"])
    ).scalar()

    return {
        "total_beds":           total_beds,
        "occupied_beds":        occupied,
        "available_beds":       bed_counts.get("Available", 0),
        "maintenance_beds":     bed_counts.get("Under Maintenance", 0),
        "bed_occupancy_rate":   round(occupied / total_beds * 100, 1) if total_beds else 0,
        "total_staff":          total_staff,
        "total_doctors":        total_doctors,
        "active_admissions":    active_admissions,
        "resource_utilization": util_rate,
    }


def get_bed_status(db: Session) -> list:
    rows = (
        db.query(Bed.bed_status, func.count().label("count"))
          .group_by(Bed.bed_status)
          .all()
    )
    return [{"status": r[0] or "Unknown", "count": r[1]} for r in rows]


def get_ward_distribution(db: Session) -> list:
    rows = (
        db.query(Bed.ward, Bed.bed_status, func.count().label("count"))
          .group_by(Bed.ward, Bed.bed_status)
          .order_by(Bed.ward)
          .all()
    )
    return [{"ward": r[0], "status": r[1], "count": r[2]} for r in rows]


def get_department_workload(db: Session) -> list:
    rows = db.execute(text("""
        SELECT d.department_name,
               COUNT(a.admission_id)  AS total_admissions,
               SUM(CASE WHEN a.admission_status IN ('Admitted','Under Treatment') THEN 1 ELSE 0 END) AS active,
               COUNT(DISTINCT a.doctor_id) AS doctors_assigned
        FROM departments d
        LEFT JOIN admissions a ON a.department_id = d.department_id
        GROUP BY d.department_name
        ORDER BY total_admissions DESC
    """)).fetchall()
    return [
        {
            "department":       r[0], "total_admissions": r[1],
            "active_patients":  r[2], "doctors_assigned": r[3],
        }
        for r in rows
    ]


def get_staff_distribution(db: Session) -> list:
    rows = db.execute(text("""
        SELECT d.department_name, s.role, COUNT(*) AS count
        FROM staff s
        JOIN departments d ON d.department_id = s.department_id
        GROUP BY d.department_name, s.role
        ORDER BY d.department_name, count DESC
    """)).fetchall()
    return [{"department": r[0], "role": r[1], "count": r[2]} for r in rows]


def get_shift_distribution(db: Session) -> list:
    rows = (
        db.query(Staff.shift, func.count().label("count"))
          .group_by(Staff.shift)
          .order_by(func.count().desc())
          .all()
    )
    return [{"shift": r[0] or "Unknown", "count": r[1]} for r in rows]


def get_resource_utilization(db: Session) -> list:
    rows = db.execute(text("""
        SELECT d.department_name, r.resource_name,
               r.quantity, r.available_quantity,
               r.quantity - r.available_quantity AS in_use
        FROM hospital_resources r
        JOIN departments d ON d.department_id = r.department_id
        ORDER BY d.department_name, r.resource_name
    """)).fetchall()
    return [
        {
            "department":    r[0], "resource":   r[1],
            "total":         r[2], "available":  r[3], "in_use": r[4],
        }
        for r in rows
    ]
