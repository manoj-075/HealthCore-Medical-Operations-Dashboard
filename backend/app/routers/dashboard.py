from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.schemas.dashboard import (
    OverviewResponse, AdmissionTrendItem,
    DeptPerformanceItem, DiagnosisItem,
)
from app.services import analytics_service as svc

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=OverviewResponse)
def overview(db: Session = Depends(get_db)):
    return svc.get_overview(db)


@router.get("/admission-trend", response_model=List[AdmissionTrendItem])
def admission_trend(db: Session = Depends(get_db)):
    try:
        return svc.get_admission_trend(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch admission trend")


@router.get("/department-performance", response_model=List[DeptPerformanceItem])
def department_performance(db: Session = Depends(get_db)):
    try:
        return svc.get_department_performance(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch department performance")


@router.get("/top-diagnoses", response_model=List[DiagnosisItem])
def top_diagnoses(limit: int = 10, db: Session = Depends(get_db)):
    try:
        return svc.get_top_diagnoses(db, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch top diagnoses")
