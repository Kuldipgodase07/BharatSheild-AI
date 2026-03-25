import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def query_enum():
    with connection.cursor() as cursor:
        cursor.execute("SELECT typname FROM pg_type WHERE typtype = 'e'")
        enums = [row[0] for row in cursor.fetchall()]
        print(f"Enums found: {enums}")
        
        for enum_name in enums:
            cursor.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = %s", [enum_name])
            labels = [row[0] for row in cursor.fetchall()]
            print(f"Labels for {enum_name}: {labels}")

if __name__ == "__main__":
    query_enum()
