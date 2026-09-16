-- ============================================================
-- Medical Operations Dashboard — PostgreSQL Schema
-- Based on actual dataset: patients, departments, doctors,
-- staff, beds, hospital_resources, admissions, billing
-- ============================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS hospital_resources CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ------------------------------------------------------------
-- 1. departments
--    Root reference table — no foreign keys
-- ------------------------------------------------------------
CREATE TABLE departments (
    department_id   VARCHAR(10)  PRIMARY KEY,          -- e.g. D001
    department_name VARCHAR(100) NOT NULL,
    floor           SMALLINT,
    building        VARCHAR(50)
);

-- ------------------------------------------------------------
-- 2. patients
--    Core patient registry — no FK dependencies
-- ------------------------------------------------------------
CREATE TABLE patients (
    patient_id      VARCHAR(10)  PRIMARY KEY,          -- e.g. P00001
    patient_name    VARCHAR(150) NOT NULL,
    age             SMALLINT     CHECK (age >= 0 AND age <= 150),
    gender          VARCHAR(20),
    blood_group     VARCHAR(5),
    city            VARCHAR(100),
    state           VARCHAR(100),
    contact_number  VARCHAR(15)
);

-- ------------------------------------------------------------
-- 3. doctors
--    Belongs to a department
-- ------------------------------------------------------------
CREATE TABLE doctors (
    doctor_id          VARCHAR(10)  PRIMARY KEY,       -- e.g. DOC0001
    doctor_name        VARCHAR(150) NOT NULL,
    department_id      VARCHAR(10)  REFERENCES departments(department_id),
    specialization     VARCHAR(100),
    experience_years   SMALLINT     CHECK (experience_years >= 0)
);

-- ------------------------------------------------------------
-- 4. staff
--    Non-doctor hospital staff, belongs to a department
-- ------------------------------------------------------------
CREATE TABLE staff (
    staff_id      VARCHAR(10)  PRIMARY KEY,            -- e.g. S0001
    staff_name    VARCHAR(150) NOT NULL,
    department_id VARCHAR(10)  REFERENCES departments(department_id),
    role          VARCHAR(50),
    shift         VARCHAR(20)
);

-- ------------------------------------------------------------
-- 5. beds
--    Physical beds, each assigned to a department
-- ------------------------------------------------------------
CREATE TABLE beds (
    bed_id        VARCHAR(10)  PRIMARY KEY,            -- e.g. B0001
    department_id VARCHAR(10)  REFERENCES departments(department_id),
    ward          VARCHAR(100),
    bed_type      VARCHAR(50),                         -- General, ICU, Private, Ventilator
    bed_status    VARCHAR(30)                          -- Available, Occupied, Under Maintenance
);

-- ------------------------------------------------------------
-- 6. hospital_resources
--    Equipment / resources per department
-- ------------------------------------------------------------
CREATE TABLE hospital_resources (
    resource_id          VARCHAR(10)  PRIMARY KEY,     -- e.g. R001
    resource_name        VARCHAR(150) NOT NULL,
    department_id        VARCHAR(10)  REFERENCES departments(department_id),
    quantity             INTEGER      CHECK (quantity >= 0),
    available_quantity   INTEGER      CHECK (available_quantity >= 0)
);

-- ------------------------------------------------------------
-- 7. admissions
--    Patient admission episodes — links patients, departments,
--    doctors, and beds
-- ------------------------------------------------------------
CREATE TABLE admissions (
    admission_id     VARCHAR(10)  PRIMARY KEY,         -- e.g. A00001
    patient_id       VARCHAR(10)  NOT NULL REFERENCES patients(patient_id),
    admission_date   DATE         NOT NULL,
    discharge_date   DATE,
    department_id    VARCHAR(10)  REFERENCES departments(department_id),
    doctor_id        VARCHAR(10)  REFERENCES doctors(doctor_id),
    bed_id           VARCHAR(10)  REFERENCES beds(bed_id),
    diagnosis        VARCHAR(200),
    treatment        VARCHAR(200),
    admission_status VARCHAR(50)                       -- Admitted, Referred, Under Treatment, Discharged
);

-- ------------------------------------------------------------
-- 8. billing
--    One bill per admission
-- ------------------------------------------------------------
CREATE TABLE billing (
    bill_id            VARCHAR(15)    PRIMARY KEY,     -- e.g. BILL00001
    patient_id         VARCHAR(10)    NOT NULL REFERENCES patients(patient_id),
    admission_id       VARCHAR(10)    NOT NULL REFERENCES admissions(admission_id),
    total_amount       NUMERIC(12, 2) NOT NULL,
    insurance_coverage NUMERIC(12, 2) DEFAULT 0,
    paid_amount        NUMERIC(12, 2) DEFAULT 0,
    payment_status     VARCHAR(30)                     -- Paid, Pending, Partially Paid, Insurance Claimed
);

-- ============================================================
-- Indexes for dashboard filtering and analytics
-- ============================================================

-- Patient lookups by city / state / blood group
CREATE INDEX idx_patients_state      ON patients(state);
CREATE INDEX idx_patients_city       ON patients(city);
CREATE INDEX idx_patients_blood_group ON patients(blood_group);

-- Admission date range queries (Overview & Operations dashboards)
CREATE INDEX idx_admissions_date     ON admissions(admission_date);
CREATE INDEX idx_admissions_discharge ON admissions(discharge_date);
CREATE INDEX idx_admissions_status   ON admissions(admission_status);
CREATE INDEX idx_admissions_patient  ON admissions(patient_id);
CREATE INDEX idx_admissions_dept     ON admissions(department_id);
CREATE INDEX idx_admissions_doctor   ON admissions(doctor_id);

-- Bed availability queries (Operations dashboard)
CREATE INDEX idx_beds_status         ON beds(bed_status);
CREATE INDEX idx_beds_dept           ON beds(department_id);

-- Financial analytics
CREATE INDEX idx_billing_status      ON billing(payment_status);
CREATE INDEX idx_billing_patient     ON billing(patient_id);
CREATE INDEX idx_billing_admission   ON billing(admission_id);

-- Staff scheduling (Operations dashboard)
CREATE INDEX idx_staff_dept          ON staff(department_id);
CREATE INDEX idx_staff_shift         ON staff(shift);

-- Resource availability (Operations dashboard)
CREATE INDEX idx_resources_dept      ON hospital_resources(department_id);

-- Doctor department lookup
CREATE INDEX idx_doctors_dept        ON doctors(department_id);
