from pydantic import BaseModel
from typing import Optional


class PatientSummary(BaseModel):
    total_patients:      int
    avg_age:             float
    gender_distribution: dict


class GenderItem(BaseModel):
    gender: str
    count:  int


class AgeGroupItem(BaseModel):
    age_group: str
    count:     int


class LocationItem(BaseModel):
    state: str
    count: int


class GeographicItem(BaseModel):
    state: str
    city: str
    count: int


class DepartmentItem(BaseModel):
    department_id: str
    department_name: str


class DiagnosisItem(BaseModel):
    diagnosis: str
    count:     int


class LongStayPatient(BaseModel):
    patient_id:    str
    patient_name:  str
    age:           Optional[int]
    gender:        Optional[str]
    admission_id:  str
    admission_date: Optional[str]
    discharge_date: Optional[str]
    diagnosis:     Optional[str]
    department:    Optional[str]
    los_days:      int
