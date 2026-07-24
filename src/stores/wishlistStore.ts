import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WishlistState {
  items: string[];
  count: number;
  toggle: (productId: string, userId?: string | null) => void;
  isWishlisted: (productId: string) => boolean;
  loadWishlist: (userId?: string | null) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  count: 0,

  toggle: async (productId, userId) => {
    if (!userId) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    const { items } = get();
    if (items.includes(productId)) {
      await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
      set((state) => {
        const newItems = state.items.filter((id) => id !== productId);
        return { items: newItems, count: newItems.length };
      });
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
      set((state) => {
        const newItems = [...state.items, productId];
        return { items: newItems, count: newItems.length };
      });
      toast.success('Added to wishlist');
    }
  },

  isWishlisted: (productId) => get().items.includes(productId),

  loadWishlist: async (userId) => {
    if (!userId) { set({ items: [], count: 0 }); return; }
    const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', userId);
    if (data) {
      const items = data.map((d) => d.product_id);
      set({ items, count: items.length });
    }
  },
}));
