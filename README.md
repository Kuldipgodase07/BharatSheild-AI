# BharatShield AI 🛡️

> **AI-powered Insurance Fraud Detection Platform for India**

BharatShield AI is a production-ready, full-stack platform for detecting insurance fraud in real-time using machine learning, document forensics, and network graph analysis.

---

## 🏗️ Project Structure

```
BharatShield_AI/
├── frontend/          # React + Vite dashboard (fraud alerts, analytics, claims)
├── backend/           # FastAPI REST API with ML inference pipelines
├── ml/                # Machine learning models and fraud scoring engine
├── data/              # Datasets, document samples, training data
├── notebooks/         # Jupyter notebooks for EDA, training & evaluation
├── docker/            # Dockerfiles and docker-compose for local dev/prod
├── k8s/               # Kubernetes manifests for cloud deployment
├── .github/           # GitHub Actions CI/CD workflows
├── docs/              # Architecture diagrams, API docs, screenshots
├── scripts/           # Database utilities, migration & seeding scripts
└── tests/             # Backend and integration test suite
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Full Stack with Docker
```bash
docker compose -f docker/docker-compose.yml up --build
```

---

## 🔑 Key Features

| Feature | Description |
|---|---|
| 🔍 Real-time Fraud Scoring | ML model scores incoming claims for fraud probability |
| 📄 Document Forensics | Deepfake & tampering detection on uploaded documents |
| 🌐 Network Graph Analysis | Visualize fraud rings and suspicious connections |
| 🚨 Alert Management | Prioritized fraud alerts with risk levels |
| 📊 Analytics Dashboard | Claims analytics, trends, and KPIs |
| 👥 User Management | Role-based access control (Admin, Investigator, Analyst) |

---

## 🧠 ML Model

- **Algorithm**: Ensemble (XGBoost + Random Forest)
- **Dataset**: `data/insuranceFraud_Dataset.csv` (~insurance claims)
- **Accuracy**: See `ml/model_status.json`
- **Training**: `python ml/fraud_detection_model.py --train`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| ML | scikit-learn, XGBoost, OpenCV |
| DevOps | Docker, Kubernetes, GitHub Actions |
| Auth | JWT (OAuth2 password flow) |

---

## 📄 License

MIT License © 2025 BharatShield AI Team
