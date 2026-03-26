# BharatShield AI 🛡️
AI-Powered Insurance Fraud Detection Platform for India  
> ### Detect Fraud Faster. Investigate Smarter. Protect Trust.
> [![Live Demo](https://img.shields.io/badge/Live-Demo-green)](#)   [![GitHub Follow](https://img.shields.io/github/followers/Kuldipgodase07?label=Follow&style=social)](https://github.com/Kuldipgodase07)   [![LinkedIn Connect](https://img.shields.io/badge/-Connect%20on%20LinkedIn-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/)   [![Kuldip Godase](https://img.shields.io/badge/-Kuldip%20Godase-blue?style=flat-square)](https://www.linkedin.com/)  

BharatShield AI is a full-stack, production-ready platform that helps detect **insurance fraud in real-time** using machine learning, document forensics, and network/network-graph analysis.  
It is designed to support insurers and investigators with **risk scoring, alerts, analytics**, and scalable deployment-ready infrastructure.

---

## Key Features

- **Real-time Fraud Scoring**: ML models score incoming claims and return fraud probability instantly.
- **Document Forensics**: Detect tampering / deepfake-like manipulation in uploaded documents.
- **Network Graph Analysis**: Identify suspicious rings and relationships between entities.
- **Alert Management**: Create and manage prioritized fraud alerts with risk levels.
- **Analytics Dashboard**: Visualize claim trends, KPIs, and fraud patterns.
- **Role-Based Access (RBAC)**: Admin / Investigator / Analyst style user roles (as applicable).
- **API-First Backend**: FastAPI REST services for easy integration.
- **DevOps Ready**: Docker, Kubernetes manifests, and CI/CD-friendly structure.

---

## Technology Stack

- **Frontend:** React 18, Vite, Recharts  
- **Backend:** FastAPI, SQLAlchemy  
- **Database:** PostgreSQL  
- **Machine Learning:** scikit-learn, XGBoost, OpenCV  
- **DevOps / Deployment:** Docker, Kubernetes, GitHub Actions  
- **Auth:** JWT (OAuth2 password flow)

---

## Why BharatShield AI?

- **Reduce Losses:** Detect fraud early and minimize payouts on suspicious claims.
- **Better Investigations:** Use risk scores, document checks, and relationship signals together.
- **Scalable:** Built for modern deployment pipelines (Docker/K8s) and real-time API inference.
- **Data-Driven Decisions:** Rich analytics and dashboards to understand fraud patterns.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dhekaleprashant673/BharatShield_AI.git
cd BharatShield_AI
```

### 2. Backend Setup (FastAPI)

**Prerequisites**
- Python 3.11+
- PostgreSQL 15+

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend will run on: `http://localhost:8000`

### 3. Frontend Setup (React + Vite)

**Prerequisites**
- Node.js 20+

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173` (default Vite port)

### 4. Full Stack with Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

---

## Project Structure

```
BharatShield_AI/
├── frontend/          # React + Vite dashboard (fraud alerts, analytics, claims)
├── backend/           # FastAPI REST API with ML inference pipelines
├── ml/                # ML models and fraud scoring engine
├── data/              # Datasets, document samples, training data
├── notebooks/         # Jupyter notebooks for EDA, training & evaluation
├── docker/            # Dockerfiles and docker-compose for local dev/prod
├── k8s/               # Kubernetes manifests for cloud deployment
├── .github/           # GitHub Actions CI/CD workflows
├── docs/              # Architecture diagrams, API docs, screenshots
├── scripts/           # DB utilities, migrations & seeding scripts
└── tests/             # Backend and integration test suite
```

---

## ML Model

- **Algorithm:** Ensemble (XGBoost + Random Forest)
- **Dataset:** `data/insuranceFraud_Dataset.csv`
- **Model Status / Accuracy:** `ml/model_status.json`
- **Training Command:**

```bash
cd ml
python fraud_detection_model.py --train --data ../data/insuranceFraud_Dataset.csv
```

---

## Screenshots

| Dashboard | Fraud Alerts | Analytics |
|----------|--------------|----------|
| *(Add screenshot here)* | *(Add screenshot here)* | *(Add screenshot here)* |

> Tip: Put images in `docs/screenshots/` and link them like:  
> `![Dashboard](docs/screenshots/dashboard.png)`

---

## Contribution Guidelines

We welcome contributions from everyone.  
Have an idea or found a bug? Please open an issue or submit a pull request.

**How to contribute:**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

- **Repository:** `dhekaleprashant673/BharatShield_AI`
- **GitHub:** [@Kuldipgodase07](https://github.com/Kuldipgodase07)
- **Live App:** *(add link here)*

---

> Protect trust in insurance with AI. Detect fraud early, investigate confidently, and build safer systems—one claim at a time.
