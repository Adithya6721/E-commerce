import axios from "axios";

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = config.url ?? "";
  const isPublicAuthRequest =
    requestUrl.includes("/auth/login") || requestUrl.endsWith("/users");

  if (token && config.headers && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
