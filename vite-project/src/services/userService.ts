import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface UserRecord {
  id: string;
  username: string;
  role: string;
}

export interface UserSummary {
  totalUsers: number;
  totalAdmins: number;
  totalCustomers: number;
}

export const getUsers = async (): Promise<UserRecord[]> => {
  const res = await api.get(`${API_BASE_URLS.user}/users/admin/all`);
  return res.data;
};

export const getUserSummary = async (): Promise<UserSummary> => {
  const res = await api.get(`${API_BASE_URLS.user}/users/summary`);
  return res.data;
};
