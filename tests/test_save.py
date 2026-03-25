import os
import django
import uuid

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import AppUser

def test_save():
    try:
        new_id = f"TEST-{str(uuid.uuid4())[:8]}"
        email = f"test-{str(uuid.uuid4())[:8]}@example.com"
        print(f"Attempting to save {new_id} / {email}...")
        
        user = AppUser.objects.create(
            id=new_id,
            name="Test User",
            email=email,
            role="Claimant",
            age=25,
            marital_status="Single",
            annual_income="10",
            state="NY",
            channel="Retail",
            risk_level="Low"
        )
        print(f"Success! Saved user: {user.id}")
    except Exception as e:
        print(f"Error saving user: {e}")

if __name__ == "__main__":
    test_save()
