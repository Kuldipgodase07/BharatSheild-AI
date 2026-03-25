import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from api.models import AppUser
print(f"Total: {AppUser.objects.count()}")
for u in AppUser.objects.all():
    print(f"  {u.id} | name={u.name} | risk_level='{u.risk_level}' | occupation='{u.occupation}'")
