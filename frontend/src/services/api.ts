import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/auth/login';
          break;
        case 403:
          toast.error('Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          // Validation errors
          if (data.details && Array.isArray(data.details)) {
            data.details.forEach((detail: string) => {
              toast.error(detail);
            });
          } else {
            toast.error(data.error || 'Validation error');
          }
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data.error || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    getProfile: () => api.get('/auth/profile'),
  },

  // Lens Flows
  lensFlows: {
    getAll: () => api.get('/lens-flows'),
    getById: (id: string) => api.get(`/lens-flows/${id}`),
    create: (data: any) => api.post('/lens-flows', data),
    update: (id: string, data: any) => api.put(`/lens-flows/${id}`, data),
    delete: (id: string) => api.delete(`/lens-flows/${id}`),
    duplicate: (id: string) => api.post(`/lens-flows/${id}/duplicate`),
    getStats: (id: string) => api.get(`/lens-flows/${id}/stats`),
    assignProduct: (id: string, productData: any) =>
      api.post(`/lens-flows/${id}/products`, productData),
    assignCollection: (id: string, collectionData: any) =>
      api.post(`/lens-flows/${id}/collections`, collectionData),
    getAvailableProducts: (id: string) =>
      api.get(`/lens-flows/${id}/products/available`),
    getAvailableCollections: (id: string) =>
      api.get(`/lens-flows/${id}/collections/available`),
  },

  // Prescriptions
  prescriptions: {
    getAll: (params?: any) => api.get('/prescriptions', { params }),
    getById: (id: string) => api.get(`/prescriptions/${id}`),
    create: (data: any) => api.post('/prescriptions', data),
    update: (id: string, data: any) => api.put(`/prescriptions/${id}`, data),
    delete: (id: string) => api.delete(`/prescriptions/${id}`),
    uploadFiles: (id: string, files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      return api.post(`/prescriptions/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    validate: (id: string, data: any) =>
      api.post(`/prescriptions/${id}/validate`, data),
    getStats: () => api.get('/prescriptions/stats/overview'),
    export: () => api.get('/prescriptions/export/csv', { responseType: 'blob' }),
    cleanup: () => api.post('/prescriptions/cleanup'),
  },

  // Orders
  orders: {
    getAll: (params?: any) => api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    updateStatus: (id: string, data: any) =>
      api.put(`/orders/${id}/status`, data),
    addTracking: (id: string, data: any) =>
      api.put(`/orders/${id}/tracking`, data),
    getByCustomer: (customerId: string) =>
      api.get(`/orders/customer/${customerId}`),
    getByStatus: (status: string) => api.get(`/orders/status/${status}`),
    getWithPrescriptions: () => api.get('/orders/with-prescriptions'),
    getStats: (params?: any) => api.get('/orders/stats/overview', { params }),
    export: (params?: any) =>
      api.get('/orders/export/csv', { params, responseType: 'blob' }),
  },

  // Settings
  settings: {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
    getTranslations: () => api.get('/settings/translations'),
    updateTranslations: (translations: any) =>
      api.put('/settings/translations', { translations }),
    getLocales: () => api.get('/settings/locales'),
    getDefaultTranslations: () => api.get('/settings/translations/default'),
    export: () => api.get('/settings/export'),
    import: (data: any) => api.post('/settings/import', data),
    reset: () => api.post('/settings/reset'),
    getPlan: () => api.get('/settings/plan'),
    updatePlan: (plan: string) => api.put('/settings/plan', { plan }),
  },

  // Dashboard
  dashboard: {
    getData: () => api.get('/dashboard'),
  },

  // Shopify Integration
  shopify: {
    getProducts: (params?: any) => api.get('/shopify/products', { params }),
    getCollections: (params?: any) => api.get('/shopify/collections', { params }),
    getOrders: (params?: any) => api.get('/shopify/orders', { params }),
    createWebhook: (data: any) => api.post('/shopify/webhooks', data),
    deleteWebhook: (id: string) => api.delete(`/shopify/webhooks/${id}`),
  },
};

// Export the axios instance for direct use
export { api };
export default api;
