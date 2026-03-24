from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import models
from database import engine, get_db
from datetime import datetime
import asyncio
import os
import json
from fraud_detection_model import (
    predict_fraud,
    predict_anomaly,
    predict_fraud_ensemble,
    predict_text_fraud,
    verify_document
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Insurance Fraud Detection API")

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
    fraud_type: str
    risk_score: int
    status: str
    policy_holder: str
    amount: float

    class Config:
        from_attributes = True

class ClaimSchema(BaseModel):
    id: str
    policy_holder: str
    claim_type: str
    amount: float
    date: datetime
    status: str
    risk_score: int
    adjuster: str
    policy_id: str

    class Config:
        from_attributes = True

class PolicySchema(BaseModel):
    id: str
    holder: str
    type: str
    premium: float
    start_date: datetime
    end_date: datetime
    status: str
    risk: str
    claims_count: int
    fraud_score: int
    email: str
    phone: str
    coverage_amount: float

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
    cnn_score: Optional[float]
    template_similarity: Optional[float]
    is_fraud: Optional[bool]
    risk_score: Optional[int]

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
    return {"message": "Welcome to Insurance Fraud Detection API"}

@app.get("/alerts", response_model=List[AlertSchema])
def get_alerts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).offset(skip).limit(limit).all()
    if not alerts:
        return [
            { "id": "ALT-9812", "claim_id": "CLM-1092", "fraud_type": "Claim Inflation", "risk_score": 94, "status": "Open", "policy_holder": "John Doe", "amount": 15400.0 },
            { "id": "ALT-9811", "claim_id": "CLM-1087", "fraud_type": "Identity Theft", "risk_score": 88, "status": "Reviewing", "policy_holder": "Alice Smith", "amount": 4200.0 },
        ]
    return alerts

@app.get("/claims", response_model=List[ClaimSchema])
def get_claims(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    claims = db.query(models.Claim).offset(skip).limit(limit).all()
    if not claims:
        return [
            {"id": "CLM-1092", "policy_holder": "John Doe", "claim_type": "Auto Collision", "amount": 15400.0, "date": datetime(2026, 3, 24), "status": "Under Review", "risk_score": 94, "adjuster": "Sarah K.", "policy_id": "POL-10046"},
            {"id": "CLM-1087", "policy_holder": "Alice Smith", "claim_type": "Medical Expense", "amount": 4200.0, "date": datetime(2026, 3, 23), "status": "Pending", "risk_score": 42, "adjuster": "Mike R.", "policy_id": "POL-10047"},
        ]
    return claims

@app.get("/policies", response_model=List[PolicySchema])
def get_policies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    policies = db.query(models.Policy).offset(skip).limit(limit).all()
    if not policies:
        return [
            {"id": "POL-10046", "holder": "Marcus Johnson", "type": "Comprehensive Auto", "premium": 1840.0, "start_date": datetime(2026, 1, 3), "end_date": datetime(2027, 1, 3), "status": "Active", "risk": "Low", "claims_count": 0, "fraud_score": 12, "email": "marcus@email.com", "phone": "+1 (555) 210-4432", "coverage_amount": 150000.0},
            {"id": "POL-10047", "holder": "Sophia Chen", "type": "Medical Premium", "premium": 3200.0, "start_date": datetime(2026, 2, 10), "end_date": datetime(2027, 2, 10), "status": "Active", "risk": "Medium", "claims_count": 2, "fraud_score": 55, "email": "sofia@email.com", "phone": "+1 (555) 987-3322", "coverage_amount": 500000.0},
        ]
    return policies

@app.get("/analytics", response_model=AnalyticsSchema)
def get_analytics(db: Session = Depends(get_db)):
    return {
        "total_claims": 1247,
        "approved_claims": 892,
        "pending_claims": 218,
        "flagged_claims": 137,
        "total_policies": 3456,
        "active_policies": 2890,
        "fraud_alerts": 45,
        "total_revenue": 1250000.0
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

@app.post("/verify-document", response_model=DocumentVerifyResponse)
def verify_document_endpoint(request: DocumentVerifyRequest):
    result = verify_document(request.image_path, request.reference_path)
    return result

@app.websocket("/ws/ai-engine")
async def ws_ai_engine(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            status = read_model_status()
            await websocket.send_json(status)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
