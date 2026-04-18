// Front_End/src/services/api.ts
import client from '../api/client';

// Re-export the client as api
export default client;

// Auth helper functions
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'super_admin' | 'admin' | 'doctor' | 'receptionist' | 'nurse';
  clinicId?: string;
  subscriptionStatus?: string;
  clinic?: {
    id: string;
    name: string;
    subscription_status?: string;
    subscription_plan?: string;
  };
}

export const setUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = async () => {
  try {
    await client.post('/api/v1/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};