import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Tender Functions ---
export const getTenders = () => {
  return apiClient.get('/tenders');
};

// --- Supplier Functions ---
export const getSuppliers = () => {
  return apiClient.get('/suppliers');
};

export const createSupplier = (supplierData) => {
  return apiClient.post('/suppliers', supplierData);
};

export const getAllSubmissions = () => {
  return apiClient.get('/submissions'); 
};
// --- Submission Functions ---
export const getSubmissionsByTenderId = (tenderId) => {
  return apiClient.get(`/submissions/${tenderId}`);
};

// --- Evaluation Functions ---
export const getEvaluations = () => {
  return apiClient.get('/evaluations'); // Assumes you created this endpoint
};

export default apiClient;
