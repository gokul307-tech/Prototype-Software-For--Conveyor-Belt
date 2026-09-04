import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    throw error;
  }
);

export const apiService = {
  // Dashboard summary data
  getDashboard: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard: ${error.message}`);
    }
  },

  // Historical sensor readings
  getHistory: async (limit = 50) => {
    try {
      const response = await api.get(`/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  },

  // Active alerts
  getAlerts: async (activeOnly = true) => {
    try {
      const response = await api.get(`/alerts?active_only=${activeOnly}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  },

  // Joint status information
  getJoints: async () => {
    try {
      const response = await api.get('/joints');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch joints: ${error.message}`);
    }
  },

  // YOLO vision inspection
  postVisionInspect: async (imageFile, jointId = 'joint_01') => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('joint_id', jointId);
      const response = await api.post('/vision/inspect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to process vision inspection: ${error.message}`);
    }
  },

  postVideoDetection: async (videoFile, jointId = 'joint_01') => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('joint_id', jointId);
      const response = await api.post('/vision/detect-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to process video: ${error.message}`);
    }
  },

  // Health check
  getHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Backend is offline: ${error.message}`);
    }
  },
};

export default apiService;
