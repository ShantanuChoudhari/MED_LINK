// services/api.ts
// Central API client for all backend calls — Production ready

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken  = (): string | null => { try { return localStorage.getItem('medlink_token'); } catch { return null; } };
export const getUser   = (): any => { try { const s = localStorage.getItem('medlink_user'); return s ? JSON.parse(s) : null; } catch { return null; } };

function saveAuth(token: string, user: any) {
  localStorage.setItem('medlink_token', token);
  localStorage.setItem('medlink_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('medlink_token');
  localStorage.removeItem('medlink_user');
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (name: string, email: string, password: string, role: string) => {
    const res = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
    if (res.token) saveAuth(res.token, res.user);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) saveAuth(res.token, res.user);
    return res;
  },
  logout: () => clearAuth(),
  getMe:  () => request('/auth/me'),
};

// ─── Patient ──────────────────────────────────────────────────────────────────
export const patientApi = {
  analyzeSymptoms: (symptoms: string) =>
    request('/ai/analyze', { method: 'POST', body: JSON.stringify({ symptoms }) }),
  searchDoctors: (params: { specialization?: string; search?: string; location?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v) as any).toString();
    return request(`/patient/doctors${qs ? '?' + qs : ''}`);
  },
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentApi = {
  getAll: () => request('/appointments'),
  book: (data: { doctorId: string; patientName?: string; date: string; time: string; type?: string; slotType?: string; notes?: string; }) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Doctor ───────────────────────────────────────────────────────────────────
export const doctorApi = {
  getDashboard: () => request('/doctor/dashboard'),
  getPatients:  () => request('/doctor/patients'),
  getProfile:   () => request('/doctor/profile'),
  updateProfile:(data: any) => request('/doctor/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: string, status: string) =>
    request(`/doctor/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Prescriptions ────────────────────────────────────────────────────────────
export const prescriptionApi = {
  getAll:  () => request('/prescriptions'),
  getById: (id: string) => request(`/prescriptions/${id}`),
  create:  (data: any) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  delete:  (id: string) => request(`/prescriptions/${id}`, { method: 'DELETE' }),
};

// ─── Medical Records ──────────────────────────────────────────────────────────
export const recordsApi = {
  getAll:  () => request('/records'),
  create:  (data: any) => request('/records', { method: 'POST', body: JSON.stringify(data) }),
  delete:  (id: string) => request(`/records/${id}`, { method: 'DELETE' }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  create:        (data: any) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getDoctorReviews: (doctorId: string) => request(`/reviews/doctor/${doctorId}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll:     () => request('/notifications'),
  markRead:   (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  delete:     (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard:  () => request('/admin/dashboard'),
  getHealth:     () => request('/admin/health'),
  getDoctors:    () => request('/admin/doctors'),
  addDoctor:     (data: any) => request('/admin/doctors', { method: 'POST', body: JSON.stringify(data) }),
  deleteDoctor:  (id: string) => request(`/admin/doctors/${id}`, { method: 'DELETE' }),
  getHospitals:  () => request('/admin/hospitals'),
  addHospital:   (data: any) => request('/admin/hospitals', { method: 'POST', body: JSON.stringify(data) }),
  deleteHospital:(id: string) => request(`/admin/hospitals/${id}`, { method: 'DELETE' }),
  getUsers:      () => request('/admin/users'),
  updateRole:    (id: string, role: string) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  analyze: (symptoms: string) =>
    request('/ai/analyze', { method: 'POST', body: JSON.stringify({ symptoms }) }),
};

// ─── Telemedicine ─────────────────────────────────────────────────────────────
export const telemedicineApi = {
  startCall: (doctorId: string) =>
    request('/telemedicine/start', { method: 'POST', body: JSON.stringify({ doctorId }) }),
};
