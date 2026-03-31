import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface LoginPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post(`${API_BASE_URLS.user}/auth/login`, data);
  return res.data;
};

export const register = async (data: LoginPayload) => {
  const res = await api.post(`${API_BASE_URLS.user}/users`, data);
  return res.data;
};
