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
  alerts: '/api/v1/alerts',
  alertsPaginated: '/api/v1/alerts', // Use the same unified endpoint
  claims: '/api/v1/claims',
  policies: '/api/v1/policies',
  analytics: '/api/v1/analytics',

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

export const getAlertsPaginated = async (skip = 0, limit = 5) => {
  try {
    const response = await api.get(`${apiEndpoints.alertsPaginated}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated alerts:', error);
    return { total: 0, alerts: [] };
  }
};

export const resolveAlert = async (alertId) => {
  try {
    const response = await api.post(`/api/v1/alerts/${alertId}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

export const getClaims = async (skip = 0, limit = 500) => {
  try {
    const response = await api.get(`${apiEndpoints.claims}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    return [];
  }
};

export const createClaim = async (claimData) => {
  try {
    const response = await api.post(apiEndpoints.claims, claimData);
    return response.data;
  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
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

// Mock data generators for fallback
export const generateMockClaims = () => [];
export const generateMockAnalytics = () => ({});

export default api;
