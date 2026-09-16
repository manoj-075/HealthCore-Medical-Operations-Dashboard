from pydantic import BaseModel
from typing import List


class OverviewResponse(BaseModel):
    total_patients:      int
    total_admissions:    int
    currently_admitted:  int
    discharged:          int
    discharge_rate:      float
    avg_length_of_stay:  float
    long_stay_patients:  int
    total_revenue:       float
    total_collected:     float
    outstanding_balance: float
    collection_rate:     float
    pending_payments:    int
    occupied_beds:       int
    available_beds:      int
    bed_occupancy_rate:  float


class AdmissionTrendItem(BaseModel):
    month:       str
    admissions:  int
    discharges:  int


class DeptPerformanceItem(BaseModel):
    department: str
    admissions: int
    avg_bill:   float


class DiagnosisItem(BaseModel):
    diagnosis: str
    count:     int
