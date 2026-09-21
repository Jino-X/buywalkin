const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'CUSTOMER' | 'BUSINESS_OWNER';
  }) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getCurrentUser: (token: string) =>
    apiRequest('/auth/me', { token }),

  // Services (public)
  getServices: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    businessId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.businessId) query.set('businessId', params.businessId);
    return apiRequest(`/services?${query.toString()}`);
  },

  getService: (id: string) => apiRequest(`/services/${id}`),

  // Availability (public)
  getAvailability: (serviceId: string, date: string) =>
    apiRequest(`/services/${serviceId}/availability?date=${date}`),

  // Bookings (customer)
  createBooking: (
    data: { serviceId: string; startTime: string },
    token: string
  ) =>
    apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getMyBookings: (token: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/bookings/my-bookings${query}`, { token });
  },

  cancelBooking: (id: string, token: string) =>
    apiRequest(`/bookings/${id}/cancel`, { method: 'PATCH', token }),

  // Business (owner)
  createBusiness: (
    data: { name: string; description?: string },
    token: string
  ) =>
    apiRequest('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getMyBusiness: (token: string) =>
    apiRequest('/businesses/me', { token }),

  updateBusiness: (
    data: { name?: string; description?: string },
    token: string
  ) =>
    apiRequest('/businesses/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  getOperatingHours: (token: string) =>
    apiRequest('/businesses/me/operating-hours', { token }),

  updateOperatingHours: (
    data: {
      hours: Array<{
        dayOfWeek: string;
        openingTime: string;
        closingTime: string;
      }>;
    },
    token: string
  ) =>
    apiRequest('/businesses/me/operating-hours', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  getBusinessBookings: (token: string) =>
    apiRequest('/businesses/me/bookings', { token }),

  // Services (owner)
  createService: (
    data: {
      name: string;
      description?: string;
      price: number;
      durationMinutes: number;
    },
    token: string
  ) =>
    apiRequest('/services', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getMyServices: (token: string) =>
    apiRequest('/services/my-services', { token }),

  updateService: (
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      durationMinutes?: number;
    },
    token: string
  ) =>
    apiRequest(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  deleteService: (id: string, token: string) =>
    apiRequest(`/services/${id}`, { method: 'DELETE', token }),
};
