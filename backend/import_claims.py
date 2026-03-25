import os
import django
import pandas as pd
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Claim

# Load data
df = pd.read_excel('Fraud data FY 2023-24 for B&CC.xlsx')

Claim.objects.all().delete()

adjusters = ['Sarah K.', 'Mike R.', 'Lisa T.', 'James L.', 'Nina P.']
names = ['John Doe', 'Alice Smith', 'Bob Johnson', 'Carol White', 'David Brown']

added = 0
claims_to_create = []

for idx, row in df.iterrows():
    if added >= 500: # Limit to 500 for UI performance
        break
        
    policy_no = str(row['Dummy Policy No'])
    claim_id = f"CLM-{policy_no}"
    
    amount = float(row.get('POLICY SUMASSURED', 0)) or 10000.0
    
    # Intimation date might be a string or timestamp
    date_val = row.get('INTIMATIONDATE')
    if pd.isna(date_val) or date_val == '-':
        date_pd = pd.Timestamp.now()
    else:
        try:
            date_pd = pd.to_datetime(date_val)
        except:
            date_pd = pd.Timestamp.now()
            
    fraud_cat = str(row.get('Fraud Category', ''))
    
    if pd.isna(row.get('Fraud Category')) or fraud_cat.lower() == 'nan':
        risk_score = random.randint(10, 45)
        status = 'Approved'
    else:
        risk_score = random.randint(80, 99)
        status = 'Flagged'
        
    claim_type = str(row.get('Product Type', 'Insurance'))
    if claim_type.lower() == 'nan':
         claim_type = 'Life Insurance'
    
    claims_to_create.append(Claim(
        id=claim_id,
        policy_holder=random.choice(names) + ' ' + str(idx),
        claim_type=claim_type,
        amount=amount,
        date=date_pd,
        status=status,
        risk_score=risk_score,
        adjuster=random.choice(adjusters),
        policy_id=f"POL-{policy_no}"
    ))
    added += 1

Claim.objects.bulk_create(claims_to_create)

print(f"Successfully inserted {added} claims into the database using Django ORM!")
