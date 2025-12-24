const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data.user;
  },

  register: async (userData: any) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data.user;
  },
};

// User APIs
export const userAPI = {
  getAll: async () => {
    return await apiCall('/users');
  },

  getById: async (id: string) => {
    return await apiCall(`/users/${id}`);
  },

  update: async (id: string, updates: any) => {
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Doctor APIs
export const doctorAPI = {
  getAll: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return await apiCall(`/doctors${query}`);
  },

  getPending: async () => {
    return await apiCall('/doctors/pending');
  },

  getApproved: async () => {
    return await apiCall('/doctors/approved');
  },

  getByHospital: async (hospitalId: string) => {
    return await apiCall(`/doctors/hospital/${hospitalId}`);
  },

  getById: async (id: string) => {
    return await apiCall(`/doctors/${id}`);
  },

  approve: async (id: string) => {
    return await apiCall(`/doctors/${id}/approve`, {
      method: 'PUT',
    });
  },

  update: async (id: string, updates: any) => {
    return await apiCall(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiCall(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Hospital APIs
export const hospitalAPI = {
  getAll: async () => {
    return await apiCall('/hospitals');
  },

  getById: async (id: string) => {
    return await apiCall(`/hospitals/${id}`);
  },

  create: async (hospitalData: any) => {
    return await apiCall('/hospitals', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  },

  update: async (id: string, updates: any) => {
    return await apiCall(`/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiCall(`/hospitals/${id}`, {
      method: 'DELETE',
    });
  },
};

// Appointment APIs
export const appointmentAPI = {
  getAll: async (filters?: { doctorId?: string; patientId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiCall(`/appointments${query}`);
  },

  getById: async (id: string) => {
    return await apiCall(`/appointments/${id}`);
  },

  create: async (appointmentData: any) => {
    return await apiCall('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return await apiCall(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return await apiCall(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Availability APIs
export const availabilityAPI = {
  get: async (doctorId: string, date: string) => {
    const data = await apiCall(`/availability/${doctorId}/${date}`);
    return data.slots || [];
  },

  set: async (doctorId: string, date: string, slots: string[]) => {
    return await apiCall('/availability/date', {
      method: 'POST',
      body: JSON.stringify({ doctorId, date, slots }),
    });
  },

  setDay: async (doctorId: string, dayOfWeek: number, slots: string[]) => {
    return await apiCall('/availability/day', {
      method: 'POST',
      body: JSON.stringify({ doctorId, dayOfWeek, slots }),
    });
  },

  getDay: async (doctorId: string, dayOfWeek: number) => {
    const data = await apiCall(`/availability/day/${doctorId}/${dayOfWeek}`);
    return data.slots || [];
  },
};

// Export FIFTEEN_MINUTE_SLOTS constant
export const FIFTEEN_MINUTE_SLOTS = (() => {
  const slots: string[] = [];
  const start = 8 * 60;
  const end = 18 * 60;
  for (let minutes = start; minutes <= end; minutes += 15) {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
})();

