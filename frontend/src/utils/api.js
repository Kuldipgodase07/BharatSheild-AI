import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const apiEndpoints = {
  // Fraud detection
  predictFraud: '/predict-fraud',
  detectAnomaly: '/detect-anomaly',

  // Data endpoints
  alerts: '/alerts',
  claims: '/claims',
  policies: '/policies',
  analytics: '/analytics',

  // Document verification
  verifyDocument: '/verify-document',
};

// Fraud detection functions
export const predictFraud = async (claimData) => {
  try {
    const response = await api.post(apiEndpoints.predictFraud, claimData);
    return response.data;
  } catch (error) {
    console.error('Error predicting fraud:', error);
    throw error;
  }
};

export const detectAnomaly = async (claimData) => {
  try {
    const response = await api.post(apiEndpoints.detectAnomaly, claimData);
    return response.data;
  } catch (error) {
    console.error('Error detecting anomaly:', error);
    throw error;
  }
};

// Data fetching functions
export const getAlerts = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`${apiEndpoints.alerts}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const getClaims = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`${apiEndpoints.claims}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    return [];
  }
};

export const getPolicies = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`${apiEndpoints.policies}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
};

export const getAnalytics = async () => {
  try {
    const response = await api.get(apiEndpoints.analytics);
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};

export const verifyDocument = async (imagePath, referencePath = null) => {
  try {
    const response = await api.post(apiEndpoints.verifyDocument, {
      image_path: imagePath,
      reference_path: referencePath || null,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying document:', error);
    throw error;
  }
};

// Mock data generators for fallback (when backend is not available)
export const generateMockClaims = () => [
  {
    id: 'CLM-1092',
    policy_holder: 'John Doe',
    claim_type: 'Auto Collision',
    amount: 15400,
    date: '2026-03-24',
    status: 'Under Review',
    risk_score: 94,
    adjuster: 'Sarah K.',
    policy_id: 'POL-001'
  },
  {
    id: 'CLM-1087',
    policy_holder: 'Alice Smith',
    claim_type: 'Medical Expense',
    amount: 4200,
    date: '2026-03-23',
    status: 'Pending',
    risk_score: 42,
    adjuster: 'Mike R.',
    policy_id: 'POL-002'
  },
  // Add more mock data...
];

export const generateMockAnalytics = () => ({
  total_claims: 1247,
  approved_claims: 892,
  pending_claims: 218,
  flagged_claims: 137,
  total_policies: 3456,
  active_policies: 2890,
  fraud_alerts: 45,
  total_revenue: 1250000.0
});

export default api;
