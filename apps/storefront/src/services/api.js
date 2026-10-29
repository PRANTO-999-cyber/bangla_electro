export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export async function refreshSession() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Session expired');
  return result.data;
}

export async function fetchWithAuth(path, accessToken, options = {}) {
  const request = (token) => fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  let response = await request(accessToken);
  if (response.status !== 401) return { response, accessToken };

  try {
    const session = await refreshSession();
    response = await request(session.accessToken);
    return { response, accessToken: session.accessToken, session };
  } catch {
    return { response, accessToken: '' };
  }
}
