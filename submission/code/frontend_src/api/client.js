import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendoreval_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (name, email, password, company) =>
  client.post('/auth/register', { name, email, password, company }).then((r) => r.data);

export const demoLogin = () =>
  client.post('/auth/demo').then((r) => r.data);

// Evaluations
export const getEvaluations = () =>
  client.get('/evaluations').then((r) => r.data);

export const createEvaluation = (title, requirementsText) =>
  client.post('/evaluations', { title, requirements_text: requirementsText }).then((r) => r.data);

export const getEvaluation = (id) =>
  client.get(`/evaluations/${id}`).then((r) => r.data);

export const uploadVendor = (evaluationId, vendorName, content) =>
  client.post(`/evaluations/${evaluationId}/upload-vendor`, { vendor_name: vendorName, content }).then((r) => r.data);

export const analyzeEvaluation = (id) =>
  client.post(`/evaluations/${id}/analyze`).then((r) => r.data);

export const getComparison = (id) =>
  client.get(`/evaluations/${id}/comparison`).then((r) => r.data);

export const getRecommendation = (id) =>
  client.get(`/evaluations/${id}/recommendation`).then((r) => r.data);

export const getReport = (id) =>
  client.get(`/evaluations/${id}/report`).then((r) => r.data);

export const chatMessage = (id, message) =>
  client.post(`/evaluations/${id}/chat`, { message }).then((r) => r.data);

export const getVendors = (id) =>
  client.get(`/evaluations/${id}/vendors`).then((r) => r.data);

export default client;
