from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# For production, use PostgreSQL
# DATABASE_URL = "postgresql://username:password@localhost:5432/insurance_fraud_db"

# For development/demo, use PostgreSQL with env var if set, else fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./insurance_fraud.db")

# Create engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print("✅ Connected to SQLite database")
elif DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
    print("✅ Connected to PostgreSQL database")
else:
    # Fallback to SQLite
    engine = create_engine("sqlite:///./insurance_fraud.db", connect_args={"check_same_thread": False})
    print("✅ Connected to SQLite database (fallback)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
