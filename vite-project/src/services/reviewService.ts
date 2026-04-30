import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface Review {
  id: string;
  productId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

/** Fetch all reviews for a product */
export const getReviews = async (productId: string): Promise<Review[]> => {
  const res = await api.get(`${API_BASE_URLS.product}/reviews/${productId}`);
  return res.data;
};

/** Submit a review — requires auth token */
export const submitReview = async (
  productId: string,
  data: ReviewInput
): Promise<Review> => {
  const res = await api.post(`${API_BASE_URLS.product}/reviews/${productId}`, data);
  return res.data;
};

/** Check if the current user has already reviewed this product */
export const checkUserReview = async (productId: string): Promise<boolean> => {
  try {
    const res = await api.get(`${API_BASE_URLS.product}/reviews/${productId}/check`);
    return res.data.reviewed ?? false;
  } catch {
    return false;
  }
};
