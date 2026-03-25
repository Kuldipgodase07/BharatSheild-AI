import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def execute_sql(cursor, sql):
    try:
        cursor.execute(sql)
        print(f"✅ Success: {sql}")
    except Exception as e:
        print(f"❌ Error for '{sql}': {e}")

def main():
    with connection.cursor() as cursor:
        # Enums in Postgres cannot be updated inside a transaction block easily for some versions,
        # but ADD VALUE is allowed. BUT standard Django cursor uses transaction.
        # We'll use autocommit mode for this.
        connection.connection.autocommit = True
        
        # Add values if they don't exist
        # PostgreSQL doesn't have "ADD VALUE IF NOT EXISTS" everywhere, so we check first.
        def add_enum_value(cursor, enum_type, value):
            cursor.execute("SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = %s AND pg_enum.enumlabel = %s", [enum_type, value])
            if not cursor.fetchone():
                execute_sql(cursor, f"ALTER TYPE {enum_type} ADD VALUE '{value}'")
            else:
                print(f"ℹ️ Value {value} already exists in {enum_type}")

        add_enum_value(cursor, 'risklevel', 'CRITICAL')
        add_enum_value(cursor, 'claimstatus', 'FLAGGED')
        add_enum_value(cursor, 'claimstatus', 'REJECTED')
        add_enum_value(cursor, 'policystatus', 'INACTIVE')
        add_enum_value(cursor, 'policystatus', 'CANCELLED')

if __name__ == "__main__":
    main()
