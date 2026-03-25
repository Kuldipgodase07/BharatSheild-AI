# BharatShield AI — ML Models

This directory contains the core machine learning pipeline for fraud detection.

## Files

| File | Description |
|---|---|
| `fraud_detection_model.py` | Main fraud scoring model (training + inference) |
| `fraudlens_bridge.py` | Bridge adapter connecting FraudLens inference to the FastAPI backend |
| `fraudlens_runner.py` | Standalone runner for batch fraud scoring |
| `model_status.json` | Runtime metadata (model version, accuracy, last trained) |

## Model Overview

- **Algorithm**: Ensemble (XGBoost + Random Forest)  
- **Task**: Binary classification — Fraud / Legitimate
- **Input**: Claim features (amount, doctor codes, patient history, etc.)
- **Output**: Fraud probability score (0–1) + risk level (LOW / MEDIUM / HIGH / CRITICAL)

## Training

```bash
cd ml/
python fraud_detection_model.py --train --data ../data/insuranceFraud_Dataset.csv
```
