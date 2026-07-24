import React, { useEffect } from 'react';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Sync cart with Supabase when user changes
export const CartSync: React.FC = () => {
  const user = useAuth((s) => s.user);
  const loadCart = useCartStore((s) => s.loadCart);
  const items = useCartStore((s) => s.items);
  const discountCode = useCartStore((s) => s.discountCode);

  useEffect(() => {
    loadCart(user?.id);
  }, [user?.id, loadCart]);

  useEffect(() => {
    if (user && items.length >= 0) {
      supabase.from('carts').upsert({
        user_id: user.id,
        items_json: items as CartItem[],
        discount_code: discountCode || null,
      }, { onConflict: 'user_id' }).then(() => {});
    }
  }, [items, discountCode, user]);

  return null;
};

export const useCart = useCartStore;
