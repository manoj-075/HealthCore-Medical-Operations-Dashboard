from sqlalchemy import Column, String, SmallInteger, Integer, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Department(Base):
    __tablename__ = "departments"
    department_id   = Column(String(10), primary_key=True)
    department_name = Column(String(100), nullable=False)
    floor           = Column(SmallInteger)
    building        = Column(String(50))

    doctors    = relationship("Doctor",   back_populates="department")
    staff      = relationship("Staff",    back_populates="department")
    beds       = relationship("Bed",      back_populates="department")
    resources  = relationship("HospitalResource", back_populates="department")
    admissions = relationship("Admission", back_populates="department")


class Patient(Base):
    __tablename__ = "patients"
    patient_id     = Column(String(10),  primary_key=True)
    patient_name   = Column(String(150), nullable=False)
    age            = Column(SmallInteger)
    gender         = Column(String(20))
    blood_group    = Column(String(5))
    city           = Column(String(100))
    state          = Column(String(100))
    contact_number = Column(String(15))

    admissions = relationship("Admission", back_populates="patient")
    billings   = relationship("Billing",   back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"
    doctor_id        = Column(String(10),  primary_key=True)
    doctor_name      = Column(String(150), nullable=False)
    department_id    = Column(String(10),  ForeignKey("departments.department_id"))
    specialization   = Column(String(100))
    experience_years = Column(SmallInteger)

    department = relationship("Department", back_populates="doctors")
    admissions = relationship("Admission",  back_populates="doctor")


class Staff(Base):
    __tablename__ = "staff"
    staff_id      = Column(String(10),  primary_key=True)
    staff_name    = Column(String(150), nullable=False)
    department_id = Column(String(10),  ForeignKey("departments.department_id"))
    role          = Column(String(50))
    shift         = Column(String(20))

    department = relationship("Department", back_populates="staff")


class Bed(Base):
    __tablename__ = "beds"
    bed_id        = Column(String(10),  primary_key=True)
    department_id = Column(String(10),  ForeignKey("departments.department_id"))
    ward          = Column(String(100))
    bed_type      = Column(String(50))
    bed_status    = Column(String(30))

    department = relationship("Department", back_populates="beds")
    admissions = relationship("Admission",  back_populates="bed")


class HospitalResource(Base):
    __tablename__ = "hospital_resources"
    resource_id        = Column(String(10),  primary_key=True)
    resource_name      = Column(String(150), nullable=False)
    department_id      = Column(String(10),  ForeignKey("departments.department_id"))
    quantity           = Column(Integer)
    available_quantity = Column(Integer)

    department = relationship("Department", back_populates="resources")


class Admission(Base):
    __tablename__ = "admissions"
    admission_id     = Column(String(10),  primary_key=True)
    patient_id       = Column(String(10),  ForeignKey("patients.patient_id"), nullable=False)
    admission_date   = Column(Date,        nullable=False)
    discharge_date   = Column(Date)
    department_id    = Column(String(10),  ForeignKey("departments.department_id"))
    doctor_id        = Column(String(10),  ForeignKey("doctors.doctor_id"))
    bed_id           = Column(String(10),  ForeignKey("beds.bed_id"))
    diagnosis        = Column(String(200))
    treatment        = Column(String(200))
    admission_status = Column(String(50))

    patient    = relationship("Patient",    back_populates="admissions")
    department = relationship("Department", back_populates="admissions")
    doctor     = relationship("Doctor",     back_populates="admissions")
    bed        = relationship("Bed",        back_populates="admissions")
    billing    = relationship("Billing",    back_populates="admission", uselist=False)


class Billing(Base):
    __tablename__ = "billing"
    bill_id            = Column(String(15),    primary_key=True)
    patient_id         = Column(String(10),    ForeignKey("patients.patient_id"), nullable=False)
    admission_id       = Column(String(10),    ForeignKey("admissions.admission_id"), nullable=False)
    total_amount       = Column(Numeric(12, 2), nullable=False)
    insurance_coverage = Column(Numeric(12, 2))
    paid_amount        = Column(Numeric(12, 2))
    payment_status     = Column(String(30))

    patient   = relationship("Patient",   back_populates="billings")
    admission = relationship("Admission", back_populates="billing")
