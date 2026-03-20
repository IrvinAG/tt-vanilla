const API = '';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(auth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

async function request(method, url, body = null, auth = true) {
  const opts = { method, headers: getHeaders(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${url}`, opts);
  if (res.status === 401) {
    localStorage.clear();
    window.location.hash = '#/login';
    throw new Error('Sesión expirada');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || JSON.stringify(data));
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }, false),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),

  // Doctors
  getDoctors: () => request('GET', '/doctors'),
  createDoctor: (data) => request('POST', '/doctors', data),
  getDoctor: (id) => request('GET', `/doctors/${id}`),
  updateDoctor: (id, data) => request('PUT', `/doctors/${id}`, data),
  deleteDoctor: (id) => request('DELETE', `/doctors/${id}`),

  // Patients
  getPatients: (search = '') => request('GET', `/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createPatient: (data) => request('POST', '/patients', data),
  getPatient: (id) => request('GET', `/patients/${id}`),
  updatePatient: (id, data) => request('PUT', `/patients/${id}`, data),

  // Notes
  getNotes: (expedienteId) => request('GET', `/notes?expediente_id=${expedienteId}`),
  createNote: (data) => request('POST', '/notes', data),
  getNote: (id) => request('GET', `/notes/${id}`),

  // Audit
  getAudit: (params = {}) => {
    const q = new URLSearchParams();
    if (params.user_id) q.set('user_id', params.user_id);
    if (params.patient_id) q.set('patient_id', params.patient_id);
    if (params.page) q.set('page', params.page);
    q.set('limit', params.limit || 50);
    return request('GET', `/audit?${q.toString()}`);
  },
};
