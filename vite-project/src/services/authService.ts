import api from "./api";

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
  const res = await api.post("http://localhost:8081/auth/login", data);
  return res.data;
};

export const register = async (data: LoginPayload) => {
  const res = await api.post("http://localhost:8081/users/register", data);
  return res.data;
};
