from django.db import models
from django.utils import timezone
import uuid

class FraudStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    REVIEWING = 'REVIEWING', 'Reviewing'
    RESOLVED = 'RESOLVED', 'Resolved'

class ClaimStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED = 'APPROVED', 'Approved'
    FLAGGED = 'FLAGGED', 'Flagged'
    REJECTED = 'REJECTED', 'Rejected'

class PolicyStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    CANCELLED = 'CANCELLED', 'Cancelled'

class RiskLevel(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'

class Alert(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    claim_id = models.CharField(max_length=100, db_index=True)
    fraud_type = models.CharField(max_length=255, null=True, blank=True)
    risk_score = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=FraudStatus.choices, default=FraudStatus.OPEN)
    date = models.DateTimeField(default=timezone.now)
    policy_holder = models.CharField(max_length=255, null=True, blank=True)
    amount = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'alerts'

class Claim(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    policy_holder = models.CharField(max_length=255, null=True, blank=True)
    claim_type = models.CharField(max_length=255, null=True, blank=True)
    amount = models.FloatField(null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=50, choices=ClaimStatus.choices, default=ClaimStatus.PENDING)
    risk_score = models.IntegerField(default=0)
    adjuster = models.CharField(max_length=255, null=True, blank=True)
    policy_id = models.CharField(max_length=100, db_index=True)

    class Meta:
        db_table = 'claims'

class Policy(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    holder = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    premium = models.FloatField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=PolicyStatus.choices, default=PolicyStatus.ACTIVE)
    risk = models.CharField(max_length=50, choices=RiskLevel.choices, default=RiskLevel.LOW)
    claims_count = models.IntegerField(default=0)
    fraud_score = models.IntegerField(default=0)
    email = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    coverage_amount = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'policies'

class AppUser(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    role = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Active')
    last_active = models.DateTimeField(default=timezone.now)
    document_verified = models.BooleanField(default=False)
    risk_score = models.IntegerField(default=0)
    fraud_flag = models.BooleanField(default=False)
    
    # New fields to match the 'User Identities' UI 
    age = models.IntegerField(null=True, blank=True, default=0)
    marital_status = models.CharField(max_length=50, null=True, blank=True, default='-')
    annual_income = models.CharField(max_length=100, null=True, blank=True, default='-')
    state = models.CharField(max_length=255, null=True, blank=True, default='-')
    channel = models.CharField(max_length=100, default='Retail')
    risk_level = models.CharField(max_length=50, default='Low')
    
    # Combined Full Record Fields
    gender = models.CharField(max_length=20, default="Male")
    occupation = models.CharField(max_length=100, default="-")
    policy_type = models.CharField(max_length=100, default="Auto")
    sum_insured = models.FloatField(default=0.0)
    claim_amount = models.FloatField(default=0.0)
    past_claims = models.IntegerField(default=0)

    class Meta:
        db_table = 'app_users'


# ─── Full Customer Record Tables ────────────────────────────────
class Customer(models.Model):
    customer_id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20, default='Unknown')
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    annual_income = models.FloatField(default=0)
    occupation = models.CharField(max_length=255, null=True, blank=True)
    past_claims_count = models.IntegerField(default=0)
    past_fraud_flag = models.BooleanField(default=False)
    late_premium_payments = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'customers'


class PolicyRecord(models.Model):
    policy_id = models.CharField(max_length=100, primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='policies')
    policy_type = models.CharField(max_length=100)
    policy_start_date = models.DateField(null=True, blank=True)
    policy_end_date = models.DateField(null=True, blank=True)
    premium_amount = models.FloatField(default=0)
    sum_insured = models.FloatField(default=0)
    policy_status = models.CharField(max_length=50, default='Active')

    class Meta:
        db_table = 'policy_records'


class ClaimRecord(models.Model):
    claim_id = models.CharField(max_length=100, primary_key=True)
    policy = models.ForeignKey(PolicyRecord, on_delete=models.CASCADE, related_name='claims')
    claim_date = models.DateField(null=True, blank=True)
    claim_amount = models.FloatField(default=0)
    incident_type = models.CharField(max_length=255, null=True, blank=True)
    incident_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    documents_submitted = models.BooleanField(default=False)
    # AI Prediction Result
    fraud_probability = models.FloatField(default=0.0)
    fraud_status = models.CharField(max_length=50, default='Pending')

    class Meta:
        db_table = 'claim_records'
