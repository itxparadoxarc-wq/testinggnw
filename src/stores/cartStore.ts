import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
  image: string;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  discountCode: string;
  discountAmount: number;
  discountType: string;
  subtotal: number;
  total: number;
  itemCount: number;
  setIsOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscountCode: (code: string) => void;
  applyDiscount: (code: string) => Promise<boolean>;
  loadCart: (userId?: string | null) => Promise<void>;
}

const CART_KEY = 'shop_cart';

function computeTotals(items: CartItem[], discountAmount: number) {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  return { subtotal, total, itemCount };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  discountCode: '',
  discountAmount: 0,
  discountType: '',
  subtotal: 0,
  total: 0,
  itemCount: 0,

  setIsOpen: (open) => set({ isOpen: open }),

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      const newItems = existing
        ? state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), i.maxQuantity) }
              : i
          )
        : [...state.items, { ...item, quantity: item.quantity || 1 }];
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return { items: newItems, ...computeTotals(newItems, state.discountAmount) };
    });
    set({ isOpen: true });
    toast.success('Added to cart');
  },

  removeItem: (variantId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.variantId !== variantId);
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return { items: newItems, ...computeTotals(newItems, state.discountAmount) };
    });
    toast.success('Removed from cart');
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) =>
        i.variantId === variantId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
      );
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return { items: newItems, ...computeTotals(newItems, state.discountAmount) };
    });
  },

  clearCart: () => {
    localStorage.removeItem(CART_KEY);
    set({ items: [], discountCode: '', discountAmount: 0, discountType: '', subtotal: 0, total: 0, itemCount: 0 });
  },

  setDiscountCode: (code) => set({ discountCode: code }),

  applyDiscount: async (code) => {
    const { items } = get();
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!data) {
      toast.error('Invalid discount code');
      return false;
    }

    const now = new Date();
    if (data.starts_at && new Date(data.starts_at) > now) {
      toast.error('Discount not yet active');
      return false;
    }
    if (data.ends_at && new Date(data.ends_at) < now) {
      toast.error('Discount has expired');
      return false;
    }
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      toast.error('Discount usage limit reached');
      return false;
    }

    const sub = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    if (data.min_purchase_amount && sub < data.min_purchase_amount) {
      toast.error(`Minimum purchase of ${formatPrice(data.min_purchase_amount)} required`);
      return false;
    }

    let discount = 0;
    if (data.type === 'percentage') {
      discount = sub * (data.value / 100);
    } else if (data.type === 'fixed_amount') {
      discount = Math.min(data.value, sub);
    }

    set((state) => ({
      discountCode: code.toUpperCase(),
      discountAmount: discount,
      discountType: data.type,
      ...computeTotals(state.items, discount),
    }));
    toast.success(data.type === 'free_shipping' ? 'Free shipping applied!' : 'Discount applied!');
    return true;
  },

  loadCart: async (userId) => {
    const stored = localStorage.getItem(CART_KEY);
    let items: CartItem[] = [];
    try { items = stored ? JSON.parse(stored) : []; } catch { items = []; }

    if (userId) {
      const { data } = await supabase
        .from('carts')
        .select('items_json, discount_code')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.items_json) {
        const serverItems = data.items_json as unknown as CartItem[];
        const merged = [...items];
        serverItems.forEach((si) => {
          if (!merged.find((li) => li.variantId === si.variantId)) merged.push(si);
        });
        items = merged;
        localStorage.setItem(CART_KEY, JSON.stringify(items));
      }
    }

    set({ items, ...computeTotals(items, 0) });
  },
}));
