import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in backend/.env")
    sys.exit(1)

# Never print the full URL — only show host/db portion
safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "localhost"
print(f"Connecting to: {safe_url}")

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Connection OK.\n")
except Exception as e:
    print(f"ERROR: Connection failed — {e}")
    sys.exit(1)

print(f"Reading schema from: {SCHEMA_PATH}")
with open(SCHEMA_PATH, encoding="utf-8") as f:
    raw = f.read()

# Split on semicolons, skip blank lines and pure-comment chunks
statements = []
for chunk in raw.split(";"):
    lines = [l for l in chunk.splitlines() if l.strip() and not l.strip().startswith("--")]
    if lines:
        statements.append(chunk.strip())

print(f"Found {len(statements)} SQL statements to execute.\n")

with engine.connect() as conn:
    for i, stmt in enumerate(statements, 1):
        label = stmt.splitlines()[0][:60]
        try:
            conn.execute(text(stmt))
            print(f"  [{i:02d}] OK  — {label}")
        except Exception as e:
            print(f"  [{i:02d}] ERR — {label}")
            print(f"         {e}")
            conn.rollback()
            sys.exit(1)
    conn.commit()
    print("\nAll statements committed.\n")

    # Verify
    tables = conn.execute(
        text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    ).fetchall()
    print(f"Tables now in medical_operations_db ({len(tables)}):")
    for t in tables:
        print(f"  - {t[0]}")

expected = {"admissions","beds","billing","departments","doctors","hospital_resources","patients","staff"}
found    = {t[0] for t in tables}
missing  = expected - found

if missing:
    print(f"\nWARNING: Missing tables: {missing}")
    sys.exit(1)
else:
    print(f"\nAll 8 tables verified. Schema is ready.")
    print("You can now run:  python database/import_data.py")
