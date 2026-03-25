from database import engine
from sqlalchemy import text

print('Testing database connection...')
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        print('PostgreSQL version:', result.fetchone()[0])
        print('✅ Connection successful!')
except Exception as e:
    print('❌ Connection failed:', str(e))