export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  LOGIN: '/login',
  REGISTER: '/register',
  SHARE: (id: string) => `/share/${id}`,
  WORKSPACE: (id: string) => `/workspace/${id}`,
};

export const API_ROUTES = {
  QUERY: '/api/query',
  INSIGHT: '/api/insight',
  DATASET: '/api/dataset',
  DATASET_BY_ID: (id: string) => `/api/dataset/${id}`,
  DASHBOARD: '/api/dashboard',
  DASHBOARD_BY_ID: (id: string) => `/api/dashboard/${id}`,
};
