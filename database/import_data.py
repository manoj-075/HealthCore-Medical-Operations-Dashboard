import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../backend/.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in backend/.env")
    sys.exit(1)

CSV_DIR = r"c:\Users\Manoj kumar R\OneDrive\Documents\infosis 7.0\files project"

# ── Helpers ───────────────────────────────────────────────────────────────────

def read_csv(filename):
    """Read CSV, skip blank lines, strip column name whitespace."""
    path = os.path.join(CSV_DIR, filename)
    df = pd.read_csv(path, encoding="utf-8-sig", skip_blank_lines=True)
    df.columns = df.columns.str.strip()
    return df

def insert(engine, table, df, pk_col):
    """Insert df into table, skip rows with duplicate PKs already in DB."""
    with engine.connect() as conn:
        existing = pd.read_sql(f"SELECT {pk_col} FROM {table}", conn)[pk_col].tolist()
    before = len(df)
    df = df[~df[pk_col].isin(existing)].copy()
    skipped = before - len(df)
    if len(df) == 0:
        print(f"  {table}: 0 inserted (all {skipped} already exist)")
        return 0
    df.to_sql(table, engine, if_exists="append", index=False, method="multi")
    print(f"  {table}: {len(df)} inserted" + (f", {skipped} skipped (duplicates)" if skipped else ""))
    return len(df)

def normalize_gender(val):
    if pd.isna(val):
        return None
    v = str(val).strip().lower()
    if v in ("male", "m"):
        return "Male"
    if v in ("female", "f"):
        return "Female"
    if v == "other":
        return "Other"
    return str(val).strip()

def normalize_shift(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    return str(val).strip().capitalize()

def safe_date(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return pd.to_datetime(val).date()
    except Exception:
        return None

def safe_smallint(val, min_val=0, max_val=120):
    """Return None for values outside the valid range."""
    try:
        v = int(float(str(val).strip()))
        return v if min_val <= v <= max_val else None
    except Exception:
        return None

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Connecting to database...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("  Connected.\n")
    except Exception as e:
        print(f"ERROR: Could not connect — {e}")
        sys.exit(1)

    counts = {}

    # ── 1. departments ────────────────────────────────────────────────────────
    print("Reading & importing departments...")
    df = read_csv("departments.csv")
    df.columns = ["department_id", "department_name", "floor", "building"]
    df["department_id"]   = df["department_id"].str.strip()
    df["department_name"] = df["department_name"].str.strip()
    df["floor"]           = pd.to_numeric(df["floor"], errors="coerce").astype("Int16")
    df["building"]        = df["building"].str.strip()
    df.drop_duplicates(subset="department_id", inplace=True)
    counts["departments"] = insert(engine, "departments", df, "department_id")

    # ── 2. patients ───────────────────────────────────────────────────────────
    print("Reading & cleaning patients...")
    df = read_csv("patients.csv")
    df.columns = ["patient_id", "patient_name", "age", "gender",
                  "blood_group", "city", "state", "contact_number"]
    df["patient_id"]      = df["patient_id"].str.strip()
    df["patient_name"]    = df["patient_name"].str.strip()
    df["age"]             = df["age"].apply(lambda x: safe_smallint(x, 0, 120))
    df["gender"]          = df["gender"].apply(normalize_gender)
    df["blood_group"]     = df["blood_group"].str.strip()
    df["city"]            = df["city"].str.strip()
    df["state"]           = df["state"].str.strip()
    df["contact_number"]  = df["contact_number"].astype(str).str.strip().replace("nan", None)
    df.drop_duplicates(subset="patient_id", keep="first", inplace=True)
    counts["patients"] = insert(engine, "patients", df, "patient_id")

    # ── 3. doctors ────────────────────────────────────────────────────────────
    print("Reading & cleaning doctors...")
    df = read_csv("doctors.csv")
    df.columns = ["doctor_id", "doctor_name", "department_id",
                  "specialization", "experience_years"]
    df["doctor_id"]        = df["doctor_id"].str.strip()
    df["doctor_name"]      = df["doctor_name"].str.strip().str.title()
    df["department_id"]    = df["department_id"].str.strip()
    df["specialization"]   = df["specialization"].str.strip()
    df["experience_years"] = df["experience_years"].apply(
        lambda x: safe_smallint(x, 0, 60))
    df.drop_duplicates(subset="doctor_id", inplace=True)
    counts["doctors"] = insert(engine, "doctors", df, "doctor_id")

    # ── 4. staff ──────────────────────────────────────────────────────────────
    print("Reading & cleaning staff...")
    df = read_csv("staff.csv")
    df.columns = ["staff_id", "staff_name", "department_id", "role", "shift"]
    df["staff_id"]      = df["staff_id"].str.strip()
    df["staff_name"]    = df["staff_name"].str.strip()
    df["department_id"] = df["department_id"].str.strip()
    df["role"]          = df["role"].str.strip()
    df["shift"]         = df["shift"].apply(normalize_shift)
    df.drop_duplicates(subset="staff_id", inplace=True)
    counts["staff"] = insert(engine, "staff", df, "staff_id")

    # ── 5. beds ───────────────────────────────────────────────────────────────
    print("Reading & cleaning beds...")
    df = read_csv("beds.csv")
    df.columns = ["bed_id", "department_id", "ward", "bed_type", "bed_status"]
    df["bed_id"]        = df["bed_id"].str.strip()
    df["department_id"] = df["department_id"].str.strip()
    df["ward"]          = df["ward"].str.strip()
    df["bed_type"]      = df["bed_type"].str.strip()
    df["bed_status"]    = df["bed_status"].str.strip()
    df.drop_duplicates(subset="bed_id", inplace=True)
    counts["beds"] = insert(engine, "beds", df, "bed_id")

    # ── 6. hospital_resources ─────────────────────────────────────────────────
    print("Reading & cleaning hospital_resources...")
    df = read_csv("hospital_resources.csv")
    df.columns = ["resource_id", "resource_name", "department_id",
                  "quantity", "available_quantity"]
    df["resource_id"]         = df["resource_id"].str.strip()
    df["resource_name"]       = df["resource_name"].str.strip()
    df["department_id"]       = df["department_id"].str.strip()
    df["quantity"]            = pd.to_numeric(df["quantity"], errors="coerce").abs().astype("Int64")
    df["available_quantity"]  = pd.to_numeric(df["available_quantity"], errors="coerce").abs().astype("Int64")
    df.drop_duplicates(subset="resource_id", inplace=True)
    counts["hospital_resources"] = insert(engine, "hospital_resources", df, "resource_id")

    # ── 7. admissions ─────────────────────────────────────────────────────────
    print("Reading & cleaning admissions...")
    df = read_csv("admissions.csv")
    df.columns = ["admission_id", "patient_id", "admission_date", "discharge_date",
                  "department_id", "doctor_id", "bed_id", "diagnosis",
                  "treatment", "admission_status"]
    df["admission_id"]     = df["admission_id"].str.strip()
    df["patient_id"]       = df["patient_id"].str.strip()
    df["admission_date"]   = pd.to_datetime(df["admission_date"], errors="coerce").dt.date
    df["discharge_date"]   = df["discharge_date"].apply(safe_date)
    df["department_id"]    = df["department_id"].str.strip()
    df["doctor_id"]        = df["doctor_id"].str.strip()
    df["bed_id"]           = df["bed_id"].str.strip()
    df["diagnosis"]        = df["diagnosis"].str.strip()
    df["treatment"]        = df["treatment"].str.strip()
    df["admission_status"] = df["admission_status"].str.strip()
    # Drop rows where admission_date is null (NOT NULL constraint)
    invalid_dates = df["admission_date"].isna().sum()
    if invalid_dates:
        print(f"  Dropping {invalid_dates} admissions with invalid admission_date")
        df = df[df["admission_date"].notna()]
    df.drop_duplicates(subset="admission_id", inplace=True)
    counts["admissions"] = insert(engine, "admissions", df, "admission_id")

    # ── 8. billing ────────────────────────────────────────────────────────────
    print("Reading & cleaning billing...")
    df = read_csv("billing.csv")
    df.columns = ["bill_id", "patient_id", "admission_id",
                  "total_amount", "insurance_coverage", "paid_amount", "payment_status"]
    df["bill_id"]            = df["bill_id"].str.strip()
    df["patient_id"]         = df["patient_id"].str.strip()
    df["admission_id"]       = df["admission_id"].str.strip()
    df["total_amount"]       = pd.to_numeric(df["total_amount"], errors="coerce").abs().round(2)
    df["insurance_coverage"] = pd.to_numeric(df["insurance_coverage"], errors="coerce").fillna(0).abs().round(2)
    df["paid_amount"]        = pd.to_numeric(df["paid_amount"], errors="coerce").fillna(0).abs().round(2)
    df["payment_status"]     = df["payment_status"].str.strip()
    # Drop rows where total_amount is null (NOT NULL constraint)
    invalid_amt = df["total_amount"].isna().sum()
    if invalid_amt:
        print(f"  Dropping {invalid_amt} billing rows with invalid total_amount")
        df = df[df["total_amount"].notna()]
    df.drop_duplicates(subset="bill_id", inplace=True)
    # Drop billing rows whose admission_id was not inserted (orphaned FKs)
    with engine.connect() as conn:
        valid_admissions = pd.read_sql("SELECT admission_id FROM admissions", conn)["admission_id"].tolist()
    orphaned = (~df["admission_id"].isin(valid_admissions)).sum()
    if orphaned:
        print(f"  Dropping {orphaned} billing rows with no matching admission")
        df = df[df["admission_id"].isin(valid_admissions)]
    counts["billing"] = insert(engine, "billing", df, "bill_id")

    # ── Summary ───────────────────────────────────────────────────────────────
    sep = "-" * 45
    print("\n" + sep)
    print("Import completed successfully.\n")
    print(f"{'Table':<25} {'Rows Inserted':>13}")
    print(sep)
    total = 0
    for table, n in counts.items():
        print(f"  {table:<23} {n:>13,}")
        total += n
    print(sep)
    print(f"  {'TOTAL':<23} {total:>13,}")

if __name__ == "__main__":
    main()
