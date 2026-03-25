import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from api.models import AppUser

# Normalize ALL risk_level values to UPPERCASE to match the PostgreSQL ENUM
mapping = {
    'Low': 'LOW', 'Medium': 'MEDIUM', 'High': 'HIGH', 'Critical': 'CRITICAL',
    'low': 'LOW', 'medium': 'MEDIUM', 'high': 'HIGH', 'critical': 'CRITICAL',
    # already uppercase = no change needed
    'LOW': 'LOW', 'MEDIUM': 'MEDIUM', 'HIGH': 'HIGH', 'CRITICAL': 'CRITICAL',
}

updated = 0
for u in AppUser.objects.all():
    normalized = mapping.get(u.risk_level)
    if normalized and normalized != u.risk_level:
        print(f"  {u.name}: '{u.risk_level}' → '{normalized}'")
        u.risk_level = normalized
        u.save()
        updated += 1

print(f"\n✅ Normalized {updated} records to UPPERCASE risk_level.")
print(f"Total users: {AppUser.objects.count()}")
