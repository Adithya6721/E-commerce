import { Product } from "./productService";

const WISHLIST_KEY = "shopapp_wishlist";

export const WISHLIST_UPDATED_EVENT = "wishlistUpdated";

export const getWishlist = (): string[] => {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
};

export const isInWishlist = (productId: string): boolean => {
  const wishlist = getWishlist();
  return wishlist.includes(productId);
};

export const toggleWishlist = (productId: string): boolean => {
  const wishlist = getWishlist();
  let newWishlist = [];
  let added = false;
  
  if (wishlist.includes(productId)) {
    newWishlist = wishlist.filter(id => id !== productId);
    added = false;
  } else {
    newWishlist = [...wishlist, productId];
    added = true;
  }
  
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
  
  return added;
};

export const getWishlistCount = (): number => {
  return getWishlist().length;
};
