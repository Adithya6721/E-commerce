import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface SellerApplyRequest {
  businessName: string;
  gstNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  phoneNumber: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  username: string;
  businessName: string;
  gstNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  phoneNumber: string;
  verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export const applyToBecomeSeller = async (data: SellerApplyRequest): Promise<SellerProfile> => {
  const res = await api.post(`${API_BASE_URLS.user}/sellers/apply`, data);
  return res.data;
};

export const getMySellerProfile = async (): Promise<SellerProfile> => {
  const res = await api.get(`${API_BASE_URLS.user}/sellers/my`);
  return res.data;
};

export const getAllSellerProfiles = async (): Promise<SellerProfile[]> => {
  const res = await api.get(`${API_BASE_URLS.user}/sellers/admin/all`);
  return res.data;
};

export const getPendingSellerProfiles = async (): Promise<SellerProfile[]> => {
  const res = await api.get(`${API_BASE_URLS.user}/sellers/admin/pending`);
  return res.data;
};

export const verifySeller = async (
  id: string,
  status: "VERIFIED" | "REJECTED" | "UNDER_REVIEW",
  rejectionReason?: string
): Promise<SellerProfile> => {
  const res = await api.put(`${API_BASE_URLS.user}/sellers/admin/${id}/verify`, {
    status,
    rejectionReason: rejectionReason || null,
  });
  return res.data;
};
