from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.finance import (
    FinanceSummary, PaymentStatusItem,
    RevenueDeptItem, InsuranceItem, RevenueTrendItem,
)
from app.services import analytics_service as svc

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/analytics")
def finance_analytics(department_id: Optional[str] = None, payment_status: Optional[str] = None,
                      insured: Optional[bool] = None, min_amount: Optional[float] = Query(None, ge=0),
                      max_amount: Optional[float] = Query(None, ge=0), start_date: Optional[str] = None,
                      end_date: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_finance_analytics(db, department_id, payment_status, insured, min_amount, max_amount, start_date, end_date)


@router.get("/summary", response_model=FinanceSummary)
def finance_summary(db: Session = Depends(get_db)):
    try:
        return svc.get_finance_summary(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch finance summary")


@router.get("/payment-status", response_model=List[PaymentStatusItem])
def payment_status(db: Session = Depends(get_db)):
    try:
        return svc.get_payment_status(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch payment status")


@router.get("/revenue-by-department", response_model=List[RevenueDeptItem])
def revenue_by_department(db: Session = Depends(get_db)):
    try:
        return svc.get_revenue_by_department(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch revenue by department")


@router.get("/insurance-analysis", response_model=List[InsuranceItem])
def insurance_analysis(db: Session = Depends(get_db)):
    try:
        return svc.get_insurance_analysis(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch insurance analysis")


@router.get("/revenue-trend", response_model=List[RevenueTrendItem])
def revenue_trend(db: Session = Depends(get_db)):
    try:
        return svc.get_revenue_trend(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch revenue trend")
