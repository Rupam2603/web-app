const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function getAccessToken() {
  const token = localStorage.getItem("subhone_access_token");
  return token;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken(); // implement using your auth provider
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API ${response.status}`);
  }
  return response.json();
}
