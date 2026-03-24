# Insurance Fraud Detection - Database Setup

## Current Database: SQLite ✅

Your project is currently using **SQLite** for development/demo purposes. This is perfect for:
- Local development
- Testing
- Demo deployments
- No external database setup required

## Database Schema

### Tables Created:
1. **alerts** - Fraud alerts and notifications
2. **claims** - Insurance claims data
3. **policies** - Insurance policy information

### Sample Data:
- 3 sample policies
- 3 sample claims
- 2 sample fraud alerts

## Production Database Options

### Option 1: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
# Create database: insurance_fraud_db
# Update database.py:
DATABASE_URL = "postgresql://username:password@localhost:5432/insurance_fraud_db"
```

### Option 2: MySQL/MariaDB
```python
DATABASE_URL = "mysql://username:password@localhost:3306/insurance_fraud_db"
```

### Option 3: Cloud Databases
- **AWS RDS** (PostgreSQL/MySQL)
- **Google Cloud SQL**
- **Azure Database**
- **Supabase** (PostgreSQL as a service)

## Database File Location
- SQLite: `backend/insurance_fraud.db`
- View with: `sqlite3 insurance_fraud.db` or any SQLite browser

## Switching Databases

1. Update `DATABASE_URL` in `database.py`
2. Install appropriate Python driver (psycopg2 for PostgreSQL, pymysql for MySQL)
3. Run `python setup_db.py` to recreate tables
4. Update `requirements.txt` if needed

## Environment Variables

Set `DATABASE_URL` environment variable for different environments:
```bash
export DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"
```