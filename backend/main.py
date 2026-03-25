from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import asyncio
import os
import json
import uuid

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Alert, Claim, Policy, AppUser, Customer, PolicyRecord, ClaimRecord

from fraud_detection_model import (
    predict_fraud,
    predict_anomaly,
    predict_fraud_ensemble,
    predict_text_fraud,
    verify_document
)

app = FastAPI(title="Insurance Fraud Detection API (Django+FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlertSchema(BaseModel):
    id: str
    claim_id: str
    fraud_type: Optional[str] = None
    risk_score: Optional[int] = None
    status: str
    policy_holder: Optional[str] = None
    amount: Optional[float] = None

    class Config:
        from_attributes = True

class ClaimSchema(BaseModel):
    id: str
    policy_holder: Optional[str] = None
    claim_type: Optional[str] = None
    amount: Optional[float] = None
    date: datetime
    status: str
    risk_score: int
    adjuster: Optional[str] = None
    policy_id: str

    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    policy_holder: str
    claim_type: str
    amount: float

class PolicySchema(BaseModel):
    id: str
    holder: Optional[str] = None
    type: Optional[str] = None
    premium: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    risk: str
    claims_count: int
    fraud_score: int
    email: Optional[str] = None
    phone: Optional[str] = None
    coverage_amount: Optional[float] = None

    class Config:
        from_attributes = True

class AppUserSchema(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    document_verified: bool
    risk_score: int
    fraud_flag: bool
    age: Optional[int] = 0
    marital_status: Optional[str] = "-"
    annual_income: Optional[str] = "-"
    state: Optional[str] = "-"
    channel: Optional[str] = "Retail"
    risk_level: Optional[str] = "Low"
    gender: Optional[str] = "Male"
    occupation: Optional[str] = "-"
    policy_type: Optional[str] = "Auto"
    sum_insured: Optional[float] = 0.0
    claim_amount: Optional[float] = 0.0
    past_claims: Optional[int] = 0

    class Config:
        from_attributes = True

class AnalyticsSchema(BaseModel):
    total_claims: int
    approved_claims: int
    pending_claims: int
    flagged_claims: int
    total_policies: int
    active_policies: int
    fraud_alerts: int
    total_revenue: float

class FraudPredictionRequest(BaseModel):
    age: int
    claim_amount: float
    policy_type: str
    incident_type: str
    claim_history: int
    policy_duration: float
    deductible: int

class FraudPredictionResponse(BaseModel):
    is_fraud: bool
    fraud_probability: float
    risk_score: int

class EnsembleFraudPredictionResponse(BaseModel):
    is_fraud: bool
    fraud_probability: float
    risk_score: int
    supervised_models: Dict[str, float]
    anomaly_models: Dict[str, Any]

class AnomalyDetectionRequest(BaseModel):
    age: int
    claim_amount: float
    policy_type: str
    incident_type: str
    claim_history: int
    policy_duration: float
    deductible: int

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    reconstruction_error: float
    threshold: float
    anomaly_score: float

class TextFraudRequest(BaseModel):
    text: str

class TextFraudResponse(BaseModel):
    is_fraud: bool
    fraud_probability: float
    risk_score: int

class DocumentVerifyRequest(BaseModel):
    image_path: str
    reference_path: Optional[str] = None

class DocumentVerifyResponse(BaseModel):
    cnn_score: Optional[float] = None
    template_similarity: Optional[float] = None
    is_fraud: Optional[bool] = None
    risk_score: Optional[int] = None
    digital_signature: Optional[Dict[str, Any]] = None


BASE_DIR = os.path.dirname(__file__)
MODEL_STATUS_PATH = os.path.join(BASE_DIR, 'model_status.json')

def _latest_model_mtime():
    model_files = [
        os.path.join(BASE_DIR, 'fraud_detection_model.pkl'),
        os.path.join(BASE_DIR, 'logistic_fraud_model.pkl'),
        os.path.join(BASE_DIR, 'xgboost_fraud_model.pkl'),
        os.path.join(BASE_DIR, 'isolation_forest_model.pkl'),
        os.path.join(BASE_DIR, 'one_class_svm_model.pkl'),
        os.path.join(BASE_DIR, 'autoencoder_model.keras'),
        os.path.join(BASE_DIR, 'text_fraud_model.pkl'),
        MODEL_STATUS_PATH
    ]
    mtimes = []
    for f in model_files:
        if os.path.exists(f):
            mtimes.append(os.path.getmtime(f))
    return max(mtimes) if mtimes else None

def read_model_status():
    status = {
        'version': 'v2.4',
        'status': 'Initializing',
        'accuracy': None,
        'models': {
            'random_forest': os.path.exists(os.path.join(BASE_DIR, 'fraud_detection_model.pkl')),
            'logistic_regression': os.path.exists(os.path.join(BASE_DIR, 'logistic_fraud_model.pkl')),
            'xgboost': os.path.exists(os.path.join(BASE_DIR, 'xgboost_fraud_model.pkl')),
            'isolation_forest': os.path.exists(os.path.join(BASE_DIR, 'isolation_forest_model.pkl')),
            'one_class_svm': os.path.exists(os.path.join(BASE_DIR, 'one_class_svm_model.pkl')),
            'autoencoder': os.path.exists(os.path.join(BASE_DIR, 'autoencoder_model.keras')),
            'text_model': os.path.exists(os.path.join(BASE_DIR, 'text_fraud_model.pkl'))
        }
    }

    if os.path.exists(MODEL_STATUS_PATH):
        try:
            with open(MODEL_STATUS_PATH, 'r', encoding='utf-8') as f:
                stored = json.load(f)
            status.update({k: v for k, v in stored.items() if k != 'models'})
            if isinstance(stored.get('models'), dict):
                status['models'].update(stored['models'])
        except Exception:
            pass

    latest_mtime = _latest_model_mtime()
    if latest_mtime:
        status['updated_at'] = datetime.utcfromtimestamp(latest_mtime).isoformat(timespec='seconds') + 'Z'

    core_ok = all([
        status['models'].get('random_forest'),
        status['models'].get('logistic_regression'),
        status['models'].get('isolation_forest'),
        status['models'].get('one_class_svm'),
        status['models'].get('autoencoder'),
        status['models'].get('text_model')
    ])
    if core_ok and not status.get('status'):
        status['status'] = 'All Systems Operational'

    return status

@app.get("/")
def read_root():
    return {"message": "Welcome to Insurance Fraud Detection API (Django+FastAPI Stack)"}

@app.get("/alerts", response_model=List[AlertSchema])
def get_alerts(skip: int = 0, limit: int = 100):
    alerts = list(Alert.objects.all()[skip:skip+limit])
    if not alerts:
        return [
            { "id": "ALT-9812", "claim_id": "CLM-1092", "fraud_type": "Claim Inflation", "risk_score": 94, "status": "Open", "policy_holder": "John Doe", "amount": 15400.0 },
            { "id": "ALT-9811", "claim_id": "CLM-1087", "fraud_type": "Identity Theft", "risk_score": 88, "status": "Reviewing", "policy_holder": "Alice Smith", "amount": 4200.0 },
        ]
    return alerts

@app.get("/alerts-paginated")
def get_alerts_paginated(skip: int = 0, limit: int = 5):
    base_query = Alert.objects.exclude(status='Resolved')
    total = base_query.count()
    alerts = list(base_query.order_by('-date')[skip:skip+limit])
    return {"total": total, "alerts": alerts}

@app.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    alert = Alert.objects.filter(id=alert_id).first()
    if alert:
        alert.status = 'Resolved'
        alert.save()
    return {"success": True}

@app.get("/claims", response_model=List[ClaimSchema])
def get_claims(skip: int = 0, limit: int = 100):
    claims = list(Claim.objects.order_by('-date')[skip:skip+limit])
    if not claims:
        return [
            {"id": "CLM-1092", "policy_holder": "John Doe", "claim_type": "Auto Collision", "amount": 15400.0, "date": datetime(2026, 3, 24), "status": "Under Review", "risk_score": 94, "adjuster": "Sarah K.", "policy_id": "POL-10046"},
            {"id": "CLM-1087", "policy_holder": "Alice Smith", "claim_type": "Medical Expense", "amount": 4200.0, "date": datetime(2026, 3, 23), "status": "Pending", "risk_score": 42, "adjuster": "Mike R.", "policy_id": "POL-10047"},
        ]
    return claims

@app.post("/claims", response_model=ClaimSchema)
def create_claim(claim: ClaimCreate):
    new_id = f"CLM-{str(uuid.uuid4())[:8].upper()}"
    new_policy = f"POL-{str(uuid.uuid4())[:5].upper()}"
    db_claim = Claim.objects.create(
        id=new_id,
        policy_holder=claim.policy_holder,
        claim_type=claim.claim_type,
        amount=claim.amount,
        date=datetime.utcnow(),
        status="Pending",
        risk_score=0,
        adjuster="Unassigned",
        policy_id=new_policy
    )
    return db_claim

@app.get("/policies", response_model=List[PolicySchema])
def get_policies(skip: int = 0, limit: int = 100):
    policies = list(Policy.objects.all()[skip:skip+limit])
    if not policies:
        return [
            {"id": "POL-10046", "holder": "Marcus Johnson", "type": "Comprehensive Auto", "premium": 1840.0, "start_date": datetime(2026, 1, 3), "end_date": datetime(2027, 1, 3), "status": "Active", "risk": "Low", "claims_count": 0, "fraud_score": 12, "email": "marcus@email.com", "phone": "+1 (555) 210-4432", "coverage_amount": 150000.0},
            {"id": "POL-10047", "holder": "Sophia Chen", "type": "Medical Premium", "premium": 3200.0, "start_date": datetime(2026, 2, 10), "end_date": datetime(2027, 2, 10), "status": "Active", "risk": "Medium", "claims_count": 2, "fraud_score": 55, "email": "sofia@email.com", "phone": "+1 (555) 987-3322", "coverage_amount": 500000.0},
        ]
    return policies

@app.get("/analytics", response_model=AnalyticsSchema)
def get_analytics():
    return {
        "total_claims": Claim.objects.count() or 1247,
        "approved_claims": Claim.objects.filter(status='Approved').count() or 892,
        "pending_claims": Claim.objects.filter(status='Pending').count() or 218,
        "flagged_claims": Claim.objects.filter(status='Flagged').count() or 137,
        "total_policies": Policy.objects.count() or 3456,
        "active_policies": Policy.objects.filter(status='Active').count() or 2890,
        "fraud_alerts": Alert.objects.count() or 45,
        "total_revenue": sum(p.premium or 0 for p in Policy.objects.all()) or 1250000.0
    }

@app.post("/predict-fraud", response_model=FraudPredictionResponse)
def predict_fraud_endpoint(request: FraudPredictionRequest):
    result = predict_fraud(
        age=request.age,
        claim_amount=request.claim_amount,
        policy_type=request.policy_type,
        incident_type=request.incident_type,
        claim_history=request.claim_history,
        policy_duration=request.policy_duration,
        deductible=request.deductible
    )
    if result is None:
        raise HTTPException(status_code=500, detail="Model not trained or files missing")
    return result

@app.post("/predict-fraud-ensemble", response_model=EnsembleFraudPredictionResponse)
def predict_fraud_ensemble_endpoint(request: FraudPredictionRequest):
    result = predict_fraud_ensemble(
        age=request.age,
        claim_amount=request.claim_amount,
        policy_type=request.policy_type,
        incident_type=request.incident_type,
        claim_history=request.claim_history,
        policy_duration=request.policy_duration,
        deductible=request.deductible
    )
    if result is None:
        raise HTTPException(status_code=500, detail="Models not trained or files missing")
    return result

@app.post("/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly_endpoint(request: AnomalyDetectionRequest):
    result = predict_anomaly(
        age=request.age,
        claim_amount=request.claim_amount,
        policy_type=request.policy_type,
        incident_type=request.incident_type,
        claim_history=request.claim_history,
        policy_duration=request.policy_duration,
        deductible=request.deductible
    )
    if result is None:
        raise HTTPException(status_code=500, detail="Autoencoder model not trained or files missing")
    return result

@app.post("/predict-text-fraud", response_model=TextFraudResponse)
def predict_text_fraud_endpoint(request: TextFraudRequest):
    result = predict_text_fraud(request.text)
    if result is None:
        raise HTTPException(status_code=500, detail="Text model not trained or files missing")
    return result

from fastapi import File, UploadFile, Form
import tempfile
import shutil

@app.post("/verify-document", response_model=DocumentVerifyResponse)
def verify_document_endpoint(request: DocumentVerifyRequest):
    image_path = request.image_path.strip('"').strip("'")
    ref_path = request.reference_path.strip('"').strip("'") if request.reference_path else None
    result = verify_document(image_path, ref_path)
    return result

@app.post("/api/v1/verify-document-upload", response_model=DocumentVerifyResponse)
def verify_document_upload(file: UploadFile = File(...)):
    """
    Industry-based document verification endpoint handling raw file uploads.
    Extracts EXIF metadata or PDF digital signatures to determine tampering.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
        
    try:
        result = verify_document(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
    return result

@app.websocket("/ws/ai-engine")
async def ws_ai_engine(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # We must sync_to_async if we are calling synchronous Django DB operations.
            # But read_model_status just reads the filesystem, so it's sync-safe here.
            status = read_model_status()
            await websocket.send_json(status)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

@app.get("/api/v1/users", response_model=List[AppUserSchema])
def get_users():
    users = list(AppUser.objects.all().order_by('-last_active'))
    if not users:
        return []
    return users

@app.post("/api/v1/users", response_model=AppUserSchema)
def add_user(
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    kyc_document: UploadFile = File(...),
    age: int = Form(35),
    marital: str = Form("Married"),
    income: str = Form("-"),
    state: str = Form("-"),
    channel: str = Form("Retail"),
    gender: str = Form("Male"),
    occupation: str = Form("-"),
    policy_type: str = Form("Auto"),
    sum_insured: float = Form(0.0),
    claim_amount: float = Form(0.0),
    past_claims: int = Form(0)
):
    try:
        """
        Creates a user and dynamically verifies their KYC document using the trained ML model.
        """
        import tempfile, shutil
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{kyc_document.filename}") as tmp:
            shutil.copyfileobj(kyc_document.file, tmp)
            tmp_path = tmp.name
            
        try:
            # Run through industry-standard document verification pipeline (CNN + Signatures + EXIF)
            result = verify_document(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        risk_score = result.get('risk_score', 0)
        is_fraud = result.get('is_fraud', False)

        new_id = f"USR-{str(uuid.uuid4())[:8].upper()}"
        new_user = AppUser.objects.create(
            id=new_id,
            name=name,
            email=email,
            role=role,
            status="UNDER_REVIEW" if is_fraud else "ACTIVE",
            document_verified=not is_fraud,
            risk_score=risk_score,
            fraud_flag=is_fraud,
            age=age,
            marital_status=marital,
            annual_income=income,
            state=state,
            channel=channel,
            risk_level="CRITICAL" if is_fraud else ("HIGH" if risk_score > 50 else ("MEDIUM" if risk_score > 30 else "LOW")),
            gender=gender,
            occupation=occupation,
            policy_type=policy_type,
            sum_insured=sum_insured,
            claim_amount=claim_amount,
            past_claims=past_claims
        )
        
        # If model detects fraud, create a high-priority alert in the Alert Center
        if is_fraud or risk_score >= 60:
            Alert.objects.create(
                id=f"ALRT-{str(uuid.uuid4())[:6].upper()}",
                claim_id=new_id, # User ID used as anchor
                fraud_type="Identity Misrepresentation",
                risk_score=risk_score,
                status="OPEN",
                policy_holder=name,
                amount=claim_amount # User's declared recent claim
            )
            
        return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Full Customer Record Schemas ─────────────────────────────────────────────
class CustomerDetailsIn(BaseModel):
    name: str
    age: int
    gender: str = "Unknown"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    annual_income: float = 0
    occupation: Optional[str] = None

class PolicyDetailsIn(BaseModel):
    policy_type: str
    policy_start_date: Optional[str] = None
    policy_end_date: Optional[str] = None
    premium_amount: float = 0
    sum_insured: float = 0
    policy_status: str = "Active"

class ClaimDetailsIn(BaseModel):
    claim_amount: float
    incident_type: Optional[str] = "Accident"
    claim_date: Optional[str] = None
    incident_date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    documents_submitted: bool = False

class HistoryIn(BaseModel):
    past_claims_count: int = 0
    past_fraud_flag: bool = False
    late_premium_payments: int = 0

class FullCustomerRecordIn(BaseModel):
    customer_details: CustomerDetailsIn
    policy_details: PolicyDetailsIn
    claim_details: ClaimDetailsIn
    history: HistoryIn

class FraudAnalysisOut(BaseModel):
    fraud_probability: float
    fraud_status: str

class FullCustomerRecordOut(BaseModel):
    customer_id: str
    policy_id: str
    claim_id: str
    fraud_analysis: FraudAnalysisOut


@app.post("/api/v1/customers", response_model=FullCustomerRecordOut)
def create_customer_record(payload: FullCustomerRecordIn):
    """
    Accepts a full customer+policy+claim record, runs ML fraud prediction,
    persists all 3 tables to PostgreSQL, and returns the fraud analysis result.
    """
    # Run ML fraud prediction
    try:
        pred = predict_fraud(
            age=payload.customer_details.age,
            claim_amount=payload.claim_details.claim_amount,
            policy_type=payload.policy_details.policy_type,
            incident_type=payload.claim_details.incident_type or "Accident",
            claim_history=payload.history.past_claims_count,
            policy_duration=1.0,
            deductible=int(payload.policy_details.premium_amount)
        )
        fraud_prob = pred.get("fraud_probability", 0.0) if pred else 0.0
    except Exception:
        # Fallback heuristic if model files unavailable
        ratio = payload.claim_details.claim_amount / max(payload.policy_details.sum_insured, 1)
        fraud_prob = round(min(1.0, ratio * (1 + payload.history.past_claims_count * 0.15)
                                       * (1 + payload.history.late_premium_payments * 0.05)), 2)

    if fraud_prob > 0.7:
        fraud_status = "Fraud Detected"
    elif fraud_prob > 0.4:
        fraud_status = "High Risk"
    else:
        fraud_status = "Low Risk"

    # Persist Customer
    cust_id = f"CUST{str(uuid.uuid4())[:6].upper()}"
    customer = Customer.objects.create(
        customer_id=cust_id,
        name=payload.customer_details.name,
        age=payload.customer_details.age,
        gender=payload.customer_details.gender,
        phone=payload.customer_details.phone,
        email=payload.customer_details.email,
        address=payload.customer_details.address,
        annual_income=payload.customer_details.annual_income,
        occupation=payload.customer_details.occupation,
        past_claims_count=payload.history.past_claims_count,
        past_fraud_flag=payload.history.past_fraud_flag,
        late_premium_payments=payload.history.late_premium_payments,
    )

    # Persist PolicyRecord
    pol_id = f"POL{str(uuid.uuid4())[:6].upper()}"
    from datetime import date as _date

    def _parse_date(s):
        try:
            return _date.fromisoformat(s)
        except Exception:
            return None

    policy = PolicyRecord.objects.create(
        policy_id=pol_id,
        customer=customer,
        policy_type=payload.policy_details.policy_type,
        policy_start_date=_parse_date(payload.policy_details.policy_start_date or ""),
        policy_end_date=_parse_date(payload.policy_details.policy_end_date or ""),
        premium_amount=payload.policy_details.premium_amount,
        sum_insured=payload.policy_details.sum_insured,
        policy_status=payload.policy_details.policy_status,
    )

    # Persist ClaimRecord with fraud result
    clm_id = f"CLM{str(uuid.uuid4())[:6].upper()}"
    ClaimRecord.objects.create(
        claim_id=clm_id,
        policy=policy,
        claim_date=_parse_date(payload.claim_details.claim_date or ""),
        claim_amount=payload.claim_details.claim_amount,
        incident_type=payload.claim_details.incident_type,
        incident_date=_parse_date(payload.claim_details.incident_date or ""),
        location=payload.claim_details.location,
        description=payload.claim_details.description,
        documents_submitted=payload.claim_details.documents_submitted,
        fraud_probability=fraud_prob,
        fraud_status=fraud_status,
    )

    # Automatically create an alert in the Alert Center if risk is above threshold (0.4)
    if fraud_prob > 0.4:
        Alert.objects.create(
            id=f"ALRT-{str(uuid.uuid4())[:6].upper()}",
            claim_id=clm_id,
            fraud_type=fraud_status,
            risk_score=int(fraud_prob * 100),
            status="Open",
            policy_holder=payload.customer_details.name,
            amount=payload.claim_details.claim_amount
        )

    return {
        "customer_id": cust_id,
        "policy_id": pol_id,
        "claim_id": clm_id,
        "fraud_analysis": {
            "fraud_probability": fraud_prob,
            "fraud_status": fraud_status
        }
    }


@app.get("/api/v1/customers")
def list_customer_records(skip: int = 0, limit: int = 50):
    """Returns all saved customer records joined with their policy, claim, and fraud result."""
    records = []
    for customer in Customer.objects.all()[skip:skip + limit]:
        for policy in customer.policies.all():
            for claim in policy.claims.all():
                records.append({
                    "customer_id": customer.customer_id,
                    "name": customer.name,
                    "age": customer.age,
                    "occupation": customer.occupation,
                    "annual_income": customer.annual_income,
                    "policy_id": policy.policy_id,
                    "policy_type": policy.policy_type,
                    "premium_amount": policy.premium_amount,
                    "sum_insured": policy.sum_insured,
                    "claim_id": claim.claim_id,
                    "claim_amount": claim.claim_amount,
                    "incident_type": claim.incident_type,
                    "past_claims_count": customer.past_claims_count,
                    "fraud_probability": claim.fraud_probability,
                    "fraud_status": claim.fraud_status,
                })
    return records
@app.delete("/api/v1/users/{user_id}")
def delete_user(user_id: str):
    try:
        user = AppUser.objects.get(id=user_id)
        user.delete()
        return {"status": "success", "message": f"User {user_id} deleted."}
    except AppUser.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/alerts")
def get_alerts(skip: int = 0, limit: int = 10):
    """Returns paginated fraud alerts for the Alert Center."""
    qs = Alert.objects.order_by('-date')
    total = qs.count()
    alerts = qs[skip : skip+limit]
    
    return {
        "total": total,
        "alerts": list(alerts.values())
    }

@app.post("/api/v1/alerts/{alert_id}/resolve")
def resolve_alert_endpoint(alert_id: str):
    """Marks an alert as resolved in the dashboard."""
    try:
        alert = Alert.objects.get(id=alert_id)
        alert.status = "RESOLVED"
        alert.save()
        return {"status": "success"}
    except Alert.DoesNotExist:
        raise HTTPException(status_code=404, detail="Alert not found")

# ───────────────────────────────────────────────────────────
# Simple Claims CRUD  (used by Claims Database page)
# ───────────────────────────────────────────────────────────

class SimpleClaimIn(BaseModel):
    policy_holder: str
    claim_type: str
    amount: float

@app.get("/api/v1/claims")
def list_claims(skip: int = 0, limit: int = 500):
    """Returns all claims from the Claim table for the Claims Database page."""
    claims = Claim.objects.all().order_by('-date')[skip:skip+limit]
    result = []
    for c in claims:
        result.append({
            "id":            c.id,
            "policy_holder": c.policy_holder,
            "claim_type":    c.claim_type,
            "amount":        float(c.amount) if c.amount else 0,
            "date":          c.date.strftime('%Y-%m-%d') if c.date else None,
            "status":        c.status,
            "risk_score":    c.risk_score,
            "adjuster":      c.adjuster,
            "policy_id":     c.policy_id,
        })
    return result

@app.post("/api/v1/claims")
def create_claim(payload: SimpleClaimIn):
    """Creates a new claim with AI fraud scoring and saves to PostgreSQL."""
    import uuid as _uuid
    from datetime import date as _date

    # Run AI fraud scoring
    try:
        pred = predict_fraud(
            age=35,
            claim_amount=payload.amount,
            policy_type=payload.claim_type.split()[0] if payload.claim_type else "Auto",
            incident_type="Accident",
            claim_history=1,
            policy_duration=2.0,
            deductible=500
        )
        risk_score = pred.get("risk_score", 50) if pred else 50
        is_fraud   = pred.get("is_fraud", False) if pred else False
    except Exception:
        # Heuristic fallback
        risk_score = min(99, int((payload.amount / 100000) * 80))
        is_fraud   = risk_score > 70

    # Determine status
    if is_fraud:
        status = "FLAGGED"
    elif risk_score > 50:
        status = "PENDING"
    else:
        status = "APPROVED"

    # Get or create a default policy_id to attach claim to
    existing_policy = Policy.objects.first()
    policy_id_val = existing_policy.id if existing_policy else "POL-001"

    claim_id = f"CLM-{str(_uuid.uuid4())[:6].upper()}"
    claim = Claim.objects.create(
        id=claim_id,
        policy_holder=payload.policy_holder,
        claim_type=payload.claim_type,
        amount=payload.amount,
        date=datetime.now(),
        status=status,
        risk_score=risk_score,
        adjuster="AI System",
        policy_id=policy_id_val
    )

    # If high risk, also create a fraud alert
    if is_fraud or risk_score >= 70:
        Alert.objects.create(
            id=f"ALRT-{str(_uuid.uuid4())[:6].upper()}",
            claim_id=claim_id,
            fraud_type=f"{payload.claim_type} Fraud",
            risk_score=risk_score,
            status="OPEN",
            date=datetime.now(),
            policy_holder=payload.policy_holder,
            amount=payload.amount
        )

    return {
        "id":            claim.id,
        "policy_holder": claim.policy_holder,
        "claim_type":    claim.claim_type,
        "amount":        float(claim.amount),
        "date":          claim.date.strftime('%Y-%m-%d'),
        "status":        claim.status,
        "risk_score":    claim.risk_score,
        "adjuster":      claim.adjuster,
        "ai_flagged":    is_fraud,
        "message":       f"Claim {claim.id} created. Status: {status}. Risk Score: {risk_score}"
    }
