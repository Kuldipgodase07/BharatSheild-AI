import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Alert, AppUser

print("=== BEFORE CLEANUP ===")
for alert in Alert.objects.all():
    print(f"  {alert.id} | holder={alert.policy_holder} | type={alert.fraud_type} | status={alert.status}")

# Delete ALL alerts that were seeded as sample data (ALT- prefix) since they are fake
# Only keep ALRT- prefixed alerts which are real AI-generated alerts
sample_ids = [a.id for a in Alert.objects.all() if a.id.startswith('ALT-')]
deleted_count = Alert.objects.filter(id__in=sample_ids).delete()
print(f"\n✅ Deleted {deleted_count[0]} stale sample alert(s): {sample_ids}")

print("\n=== AFTER CLEANUP ===")
for alert in Alert.objects.all():
    print(f"  {alert.id} | holder={alert.policy_holder} | type={alert.fraud_type} | status={alert.status}")

# Also show the real users so we can verify
print("\n=== REAL USERS IN DATABASE ===")
for user in AppUser.objects.all():
    print(f"  {user.id} | name={user.name} | risk={user.risk_level} | score={user.risk_score}")
