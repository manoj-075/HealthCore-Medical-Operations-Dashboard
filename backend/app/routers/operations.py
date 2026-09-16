from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.operations import (
    OperationsSummary, BedStatusItem, WardItem,
    DeptWorkloadItem, StaffDistItem, ShiftItem, ResourceItem,
)
from app.services import analytics_service as svc

router = APIRouter(prefix="/api/operations", tags=["Operations"])

@router.get("/analytics")
def operations_analytics(department_id: Optional[str] = None, bed_status: Optional[str] = None,
                         shift: Optional[str] = None, resource_type: Optional[str] = None,
                         db: Session = Depends(get_db)):
    return svc.get_operations_analytics(db, department_id, bed_status, shift, resource_type)


@router.get("/summary", response_model=OperationsSummary)
def operations_summary(db: Session = Depends(get_db)):
    try:
        return svc.get_operations_summary(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch operations summary")


@router.get("/bed-status", response_model=List[BedStatusItem])
def bed_status(db: Session = Depends(get_db)):
    try:
        return svc.get_bed_status(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch bed status")


@router.get("/ward-distribution", response_model=List[WardItem])
def ward_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_ward_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch ward distribution")


@router.get("/department-workload", response_model=List[DeptWorkloadItem])
def department_workload(db: Session = Depends(get_db)):
    try:
        return svc.get_department_workload(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch department workload")


@router.get("/staff-distribution", response_model=List[StaffDistItem])
def staff_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_staff_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch staff distribution")


@router.get("/shift-distribution", response_model=List[ShiftItem])
def shift_distribution(db: Session = Depends(get_db)):
    try:
        return svc.get_shift_distribution(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch shift distribution")


@router.get("/resource-utilization", response_model=List[ResourceItem])
def resource_utilization(db: Session = Depends(get_db)):
    try:
        return svc.get_resource_utilization(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch resource utilization")
