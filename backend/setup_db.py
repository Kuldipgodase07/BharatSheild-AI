#!/usr/bin/env python3
"""
Database setup and sample data population script for Insurance Fraud Detection
"""

from database import engine, SessionLocal
from models import Base, Alert, Claim, Policy, ClaimStatus, PolicyStatus, RiskLevel, FraudStatus
from datetime import datetime, timedelta
import random

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

def populate_sample_data():
    """Populate database with sample data"""
    print("Populating database with sample data...")

    db = SessionLocal()

    try:
        # Sample Policies
        policies_data = [
            {
                "id": "POL-001",
                "holder": "John Doe",
                "type": "Auto Insurance",
                "premium": 1200.00,
                "start_date": datetime.now() - timedelta(days=365),
                "end_date": datetime.now() + timedelta(days=365),
                "status": PolicyStatus.ACTIVE,
                "risk": RiskLevel.LOW,
                "claims_count": 1,
                "fraud_score": 15,
                "email": "john.doe@email.com",
                "phone": "+1-555-0101",
                "coverage_amount": 500000.00
            },
            {
                "id": "POL-002",
                "holder": "Alice Smith",
                "type": "Health Insurance",
                "premium": 2400.00,
                "start_date": datetime.now() - timedelta(days=180),
                "end_date": datetime.now() + timedelta(days=545),
                "status": PolicyStatus.ACTIVE,
                "risk": RiskLevel.MEDIUM,
                "claims_count": 2,
                "fraud_score": 25,
                "email": "alice.smith@email.com",
                "phone": "+1-555-0102",
                "coverage_amount": 1000000.00
            },
            {
                "id": "POL-003",
                "holder": "Bob Johnson",
                "type": "Property Insurance",
                "premium": 1800.00,
                "start_date": datetime.now() - timedelta(days=90),
                "end_date": datetime.now() + timedelta(days=275),
                "status": PolicyStatus.ACTIVE,
                "risk": RiskLevel.HIGH,
                "claims_count": 0,
                "fraud_score": 85,
                "email": "bob.johnson@email.com",
                "phone": "+1-555-0103",
                "coverage_amount": 750000.00
            }
        ]

        for policy_data in policies_data:
            policy = Policy(**policy_data)
            db.add(policy)

        # Sample Claims
        claims_data = [
            {
                "id": "CLM-001",
                "policy_holder": "John Doe",
                "claim_type": "Auto Accident",
                "amount": 15400.00,
                "date": datetime.now() - timedelta(days=30),
                "status": ClaimStatus.FLAGGED,
                "risk_score": 94,
                "adjuster": "Sarah Kim",
                "policy_id": "POL-001"
            },
            {
                "id": "CLM-002",
                "policy_holder": "Alice Smith",
                "claim_type": "Medical Expense",
                "amount": 4200.00,
                "date": datetime.now() - timedelta(days=15),
                "status": ClaimStatus.PENDING,
                "risk_score": 42,
                "adjuster": "Mike Rodriguez",
                "policy_id": "POL-002"
            },
            {
                "id": "CLM-003",
                "policy_holder": "Bob Johnson",
                "claim_type": "Property Damage",
                "amount": 88000.00,
                "date": datetime.now() - timedelta(days=7),
                "status": ClaimStatus.APPROVED,
                "risk_score": 18,
                "adjuster": "Lisa Thompson",
                "policy_id": "POL-003"
            }
        ]

        for claim_data in claims_data:
            claim = Claim(**claim_data)
            db.add(claim)

        # Sample Alerts
        alerts_data = [
            {
                "id": "ALT-001",
                "claim_id": "CLM-001",
                "fraud_type": "Suspicious Claim Pattern",
                "risk_score": 94,
                "status": FraudStatus.OPEN,
                "policy_holder": "John Doe",
                "amount": 15400.00
            },
            {
                "id": "ALT-002",
                "claim_id": "CLM-002",
                "fraud_type": "Unusual Claim Amount",
                "risk_score": 67,
                "status": FraudStatus.REVIEWING,
                "policy_holder": "Alice Smith",
                "amount": 4200.00
            }
        ]

        for alert_data in alerts_data:
            alert = Alert(**alert_data)
            db.add(alert)

        db.commit()
        print("✅ Sample data populated successfully!")

    except Exception as e:
        print(f"❌ Error populating data: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main setup function"""
    print("🚀 Setting up Insurance Fraud Detection Database")
    print("=" * 50)

    create_tables()
    populate_sample_data()

    print("\n📊 Database Summary:")
    print("- Tables: alerts, claims, policies")
    print("- Sample data: 3 policies, 3 claims, 2 alerts")
    print("- Database file: insurance_fraud.db (SQLite)")

    print("\n🎯 Ready to use!")
    print("Run: python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    main()