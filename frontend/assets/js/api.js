const API_BASE = "";

async function api(path, options = {}) {
  const token = localStorage.getItem("rewareToken");
  const headers = options.headers || {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem("rewareToken");
    localStorage.removeItem("rewareStudent");
    if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
      window.location.href = "/index.html";
    }
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (_err) {
      // no-op
    }
    throw new Error(message);
  }

  return response.json();
}
