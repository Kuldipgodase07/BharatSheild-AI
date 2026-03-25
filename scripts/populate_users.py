import os
import django
import uuid
from datetime import datetime

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import AppUser

def populate_users():
    users_to_add = [
        # Top rows from screenshot
        { "id": "USR-19026A9D", "role": "Employee", "name": "Michael Scott", "email": "michael.mgr@company.com", "age": 35, "marital": "-", "income": "-", "state": "Scranton", "channel": "Retail", "ea": "5%", "risk": "Low", "v": True },
        { "id": "USR-6243461F", "role": "Claimant", "name": "Shadow Broker", "email": "shadow@unverified.xyz", "age": 35, "marital": "-", "income": "-", "state": "CyberSpace", "channel": "Retail", "ea": "94%", "risk": "Critical", "v": False },
        { "id": "USR-B6022948", "role": "Agent", "name": "Jane Doe", "email": "jane@test.org", "age": 35, "marital": "-", "income": "-", "state": "Testing", "channel": "Retail", "ea": "11%", "risk": "Low", "v": True },
        { "id": "USR-D7C27CD6D", "role": "Investigator", "name": "Rajdip Bankar", "email": "rajdipbankar786@gmail.com", "age": 35, "marital": "-", "income": "-", "state": "Security", "channel": "Retail", "ea": "97%", "risk": "Critical", "v": False },
        
        # Data from ALL_DATA in Users.jsx
        { "id": "#0037", "role": "Traditional", "name": "Agriculturist", "email": "madhya.pradesh@gov.in", "age": 36, "marital": "Married", "income": "₹3.0L", "state": "Madhya Pradesh", "channel": "Retail", "ea": "3.1x", "risk": "Critical", "v": False },
        { "id": "#0015", "role": "ULIP", "name": "Housewife", "email": "uttar.pradesh@home.org", "age": 52, "marital": "Married", "income": "₹1.0L", "state": "Uttar Pradesh", "channel": "Banca", "ea": "5.0x", "risk": "Critical", "v": False },
        { "id": "#0014", "role": "ULIP", "name": "Housewife", "email": "madhya.pradesh.h@home.org", "age": 34, "marital": "Married", "income": "₹1.0L", "state": "Madhya Pradesh", "channel": "Banca", "ea": "5.0x", "risk": "Critical", "v": False },
        { "id": "#1103", "role": "Pension", "name": "Retired", "email": "delhi.ret@govt.in", "age": 73, "marital": "Married", "income": "₹22.50D", "state": "Delhi", "channel": "Mail", "ea": "4.0x", "risk": "Critical", "v": False },
        { "id": "#0216", "role": "ULIP", "name": "Housewife", "email": "up.housewife@home.org", "age": 45, "marital": "Married", "income": "₹4.7L", "state": "Uttar Pradesh", "channel": "Banca", "ea": "3.1x", "risk": "Critical", "v": False },
        { "id": "#0305", "role": "Traditional", "name": "Housewife", "email": "tn.housewife@home.org", "age": 54, "marital": "Married", "income": "₹0.0L", "state": "Tamil Nadu", "channel": "Retail", "ea": "8.3x", "risk": "Critical", "v": False },
        { "id": "#0027", "role": "Traditional", "name": "Self-Employed", "email": "jh.self@biz.org", "age": 40, "marital": "Married", "income": "₹1.0L", "state": "Jharkhand", "channel": "Banca", "ea": "14.4x", "risk": "Critical", "v": False },
        { "id": "#0038", "role": "ULIP", "name": "Agriculturist", "email": "rj.agri@farms.in", "age": 68, "marital": "Married", "income": "₹0.0L", "state": "Rajasthan", "channel": "Retail", "ea": "4.7x", "risk": "Critical", "v": False },
        { "id": "#0001", "role": "Traditional", "name": "Service", "email": "jh.service@company.in", "age": 29, "marital": "Single", "income": "₹6.2L", "state": "Jharkhand", "channel": "Retail", "ea": "2.9x", "risk": "Critical", "v": False },
        { "id": "#0006", "role": "ULIP", "name": "Service", "email": "ts.service@company.in", "age": 46, "marital": "Married", "income": "₹7.9L", "state": "Telangana", "channel": "Banca", "ea": "0.6x", "risk": "Critical", "v": False },
        { "id": "#0011", "role": "ULIP", "name": "Business", "email": "dl.biz@corp.in", "age": 54, "marital": "Married", "income": "₹12.0L", "state": "Delhi", "channel": "Banca", "ea": "4.3x", "risk": "Critical", "v": False },
        { "id": "#0013", "role": "ULIP", "name": "Service", "email": "ka.service@company.in", "age": 50, "marital": "Married", "income": "₹22.0L", "state": "Karnataka", "channel": "Banca", "ea": "0.9x", "risk": "Critical", "v": False },
        { "id": "#0042", "role": "Traditional", "name": "Profession", "email": "mh.prof@work.in", "age": 38, "marital": "Married", "income": "₹8.5L", "state": "Maharashtra", "channel": "Retail", "ea": "3.0x", "risk": "Critical", "v": False },
        { "id": "#0055", "role": "ULIP", "name": "Student", "email": "gj.student@univ.in", "age": 22, "marital": "Single", "income": "₹0.5L", "state": "Gujarat", "channel": "Banca", "ea": "6.2x", "risk": "Critical", "v": False },
        { "id": "#0071", "role": "Pension", "name": "Retired", "email": "pb.ret@govt.in", "age": 65, "marital": "Married", "income": "₹18.0L", "state": "Punjab", "channel": "Mail", "ea": "0.0x", "risk": "Critical", "v": False },
        { "id": "#0034", "role": "Traditional", "name": "Service", "email": "br.service@company.in", "age": 34, "marital": "Married", "income": "₹5.0L", "state": "Bihar", "channel": "Retail", "ea": "2.0x", "risk": "Critical", "v": False },
        { "id": "#0049", "role": "ULIP", "name": "Service", "email": "tn.service@company.in", "age": 43, "marital": "Married", "income": "₹7.9L", "state": "Tamil Nadu", "channel": "Banca", "ea": "1.0x", "risk": "Critical", "v": False },
        { "id": "#0104", "role": "Traditional", "name": "Agriculturist", "email": "hp.agri@farms.in", "age": 41, "marital": "Married", "income": "₹1.9L", "state": "Himachal Pradesh", "channel": "Retail", "ea": "22.5x", "risk": "Critical", "v": False },
    ]

    print(f"Starting population of {len(users_to_add)} users...")
    
    for u in users_to_add:
        # Avoid duplicates
        if AppUser.objects.filter(id=u['id']).exists() or AppUser.objects.filter(email=u['email']).exists():
            print(f"Skipping {u['id']} / {u['email']} (already exists)")
            continue
            
        risk_score_str = u['ea'].replace('%', '').replace('x', '')
        try:
            risk_score = int(float(risk_score_str))
        except:
            risk_score = 0
            
        AppUser.objects.create(
            id=u['id'],
            name=u['name'],
            email=u['email'],
            role=u['role'],
            age=u['age'],
            marital_status=u['marital'],
            annual_income=u['income'],
            state=u['state'],
            channel=u['channel'],
            risk_level=u['risk'],
            risk_score=risk_score,
            fraud_flag=(u['risk'] == 'Critical'),
            document_verified=u['v'],
            status="Active" if u['v'] else "Flagged"
        )
        print(f"Added {u['name']} ({u['id']})")

    print("Success: Database populated with user identities!")

if __name__ == "__main__":
    populate_users()
