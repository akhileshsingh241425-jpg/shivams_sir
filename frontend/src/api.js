import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const login = (credentials) => api.post('/login', credentials);

// Equipment APIs
export const getEquipment = (params = {}) => api.get('/equipment', { params });
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const getEquipmentByEid = (eid) => api.get(`/equipment/by-eid/${eid}`);
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);

// PM Task APIs
export const getTasks = (equipmentId) => api.get(`/equipment/${equipmentId}/tasks`);
export const createTask = (equipmentId, data) => api.post(`/equipment/${equipmentId}/tasks`, data);
export const createTasksBulk = (equipmentId, tasks) => api.post(`/equipment/${equipmentId}/tasks/bulk`, { tasks });
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const completeTask = (taskId, data) => api.post(`/tasks/${taskId}/complete`, data);

// PM History APIs
export const getHistory = (params = {}) => api.get('/history', { params });

// Dashboard APIs
export const getDashboard = () => api.get('/dashboard');
export const recalculateStatuses = () => api.post('/dashboard/recalculate');

// Prediction APIs
export const getPredictions = () => api.get('/predictions');

// Dropdown Options APIs
export const getDropdownOptions = () => api.get('/dropdown-options');

// Metadata APIs
export const getSections = () => api.get('/sections');
export const getEquipmentNames = () => api.get('/equipment-names');
export const getLines = () => api.get('/lines');

// Excel Import/Export APIs
export const importExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const exportExcel = () => {
  return api.get('/export-excel', { responseType: 'blob' });
};

export default api;
