import React, { useEffect } from 'react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuth } from './AuthContext';

// Sync wishlist with Supabase when user changes
export const WishlistSync: React.FC = () => {
  const user = useAuth((s) => s.user);
  const loadWishlist = useWishlistStore((s) => s.loadWishlist);

  useEffect(() => {
    loadWishlist(user?.id);
  }, [user?.id]);

  return null;
};

export const useWishlist = useWishlistStore;
