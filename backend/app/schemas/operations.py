from pydantic import BaseModel


class OperationsSummary(BaseModel):
    total_beds:           int
    occupied_beds:        int
    available_beds:       int
    maintenance_beds:     int
    bed_occupancy_rate:   float
    total_staff:          int
    total_doctors:        int
    active_admissions:    int
    resource_utilization: float


class BedStatusItem(BaseModel):
    status: str
    count:  int


class WardItem(BaseModel):
    ward:   str
    status: str
    count:  int


class DeptWorkloadItem(BaseModel):
    department:       str
    total_admissions: int
    active_patients:  int
    doctors_assigned: int


class StaffDistItem(BaseModel):
    department: str
    role:       str
    count:      int


class ShiftItem(BaseModel):
    shift: str
    count: int


class ResourceItem(BaseModel):
    department: str
    resource:   str
    total:      int
    available:  int
    in_use:     int
