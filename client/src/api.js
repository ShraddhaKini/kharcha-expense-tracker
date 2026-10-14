// In development the Vite proxy handles /api. For a deployed site, set
// VITE_API_URL (for example https://your-api.onrender.com) at build time.
const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'kharcha_token';

let token = localStorage.getItem(TOKEN_KEY);

export const getToken = () => token;

export function setToken(value) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON response */
  }

  // An expired session: clear it and let the app show the login screen.
  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('kharcha:logout'));
  }
  if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data;
}

const qs = (params) => new URLSearchParams(params).toString();

export const api = {
  health: () => request('/health'),
  register: (form) => request('/auth/register', { method: 'POST', body: form }),
  login: ({ email, password }) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  listExpenses: (month) => request(`/expenses?${qs({ month })}`),
  parseText: (text, today) => request('/expenses/parse', { method: 'POST', body: { text, today } }),
  saveExpenses: (items, rawText, today) =>
    request('/expenses', { method: 'POST', body: { items, rawText, today } }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  insights: (month, today) => request(`/insights?${qs({ month, today })}`),
  aiSummary: (month, today) => request(`/insights/ai-summary?${qs({ month, today })}`),
};
