from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.patients import (
    PatientSummary, GenderItem, AgeGroupItem,
    LocationItem, DepartmentItem, DiagnosisItem, LongStayPatient,
)
from app.services import analytics_service as svc

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("/summary", response_model=PatientSummary)
def patient_summary(db: Session = Depends(get_db)):
    try:
        return svc.get_patient_summary(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch patient summary")


@router.get("/gender-distribution", response_model=List[GenderItem])
def gender_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_gender_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch gender distribution")


@router.get("/age-distribution", response_model=List[AgeGroupItem])
def age_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_age_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch age distribution")


@router.get("/location-distribution", response_model=List[LocationItem])
def location_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_location_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch location distribution")


@router.get("/geographic-analysis")
def geographic_analysis(db: Session = Depends(get_db)):
    try:
        return svc.get_geographic_analysis(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch geographic analysis")


@router.get("/departments", response_model=List[DepartmentItem])
def departments(db: Session = Depends(get_db)):
    try:
        return svc.get_departments(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch departments")


@router.get("/analytics")
def patient_analytics(
    department_id: Optional[str] = Query(None),
    threshold_days: int = Query(7, ge=1),
    gender: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    age_group: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        return svc.get_filtered_patient_analytics(
            db=db,
            department_id=department_id,
            threshold_days=threshold_days,
            gender=gender,
            state=state,
            city=city,
            age_group=age_group,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch filtered patient analytics")


@router.get("/diagnosis-analysis", response_model=List[DiagnosisItem])
def diagnosis_analysis(
    department_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        return svc.get_diagnosis_analysis(db, department_id=department_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch diagnosis analysis")


@router.get("/long-stay", response_model=List[LongStayPatient])
def long_stay(
    threshold_days: int = Query(7, ge=1),
    db: Session = Depends(get_db),
):
    return svc.get_long_stay_patients(db, threshold_days=threshold_days)
