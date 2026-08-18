const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No fue posible guardar los cambios.');
  }
  return response.status === 204 ? null : response.json();
}
