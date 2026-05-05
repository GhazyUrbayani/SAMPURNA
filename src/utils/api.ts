import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-010e5093`;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Use access token if provided (for authenticated requests), otherwise use public anon key
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Device API
export const deviceAPI = {
  getAll: () => apiCall('/devices'),

  create: (device: any, accessToken: string) =>
    apiCall('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    }, accessToken),

  update: (id: string, updates: any, accessToken: string) =>
    apiCall(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, accessToken),

  delete: (id: string, accessToken: string) =>
    apiCall(`/devices/${id}`, {
      method: 'DELETE',
    }, accessToken),
};

// Analytics API
export const analyticsAPI = {
  get: () => apiCall('/analytics'),

  update: (data: any, accessToken: string) =>
    apiCall('/analytics', {
      method: 'POST',
      body: JSON.stringify(data),
    }, accessToken),
};

// Auth API
export const authAPI = {
  signup: (email: string, password: string, name: string) =>
    apiCall('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
};
