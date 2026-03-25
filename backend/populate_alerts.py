import os
import django
import uuid
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Claim, Alert

Alert.objects.all().delete()

flagged_claims = Claim.objects.filter(status='Flagged')

added = 0
for claim in flagged_claims:
    types = ['Claim Inflation', 'Identity Theft', 'Premium Fraud', 'Duplicate Claim', 'Documentation Forgery']
    fraud_type = random.choice(types)
    
    rscore = claim.risk_score
    if rscore < 50:
        rscore = random.randint(70, 99)
        
    alt = Alert.objects.create(
        id=f"ALT-{str(uuid.uuid4())[:8].upper()}",
        claim_id=claim.id,
        fraud_type=fraud_type,
        risk_score=rscore,
        status='OPEN',
        date=claim.date,
        policy_holder=claim.policy_holder,
        amount=claim.amount
    )
    added += 1

print(f"Populated {added} alerts from flagged claims using Django ORM!")
