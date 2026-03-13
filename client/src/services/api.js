export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    if (window.location.pathname !== '/login') {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return response;
};

