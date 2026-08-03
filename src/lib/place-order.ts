import { supabase } from '@/integrations/supabase/client';

export interface PlaceOrderItem {
  product_id?: string | null;
  variant_id?: string | null;
  title: string;
  variant_title?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string | null;
}

export interface PlaceOrderPayload {
  email: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  shipping_address_json: Record<string, unknown>;
  billing_address_json: Record<string, unknown>;
  status?: string;
  payment_status?: string;
  stripe_payment_intent_id?: string | null;
  notes?: string | null;
  timeline_note?: string | null;
}

/**
 * Creates an order through a single secure database function so guests and
 * signed-in customers both succeed (no RLS round-trips, no partial orders).
 */
export async function placeOrder(order: PlaceOrderPayload, items: PlaceOrderItem[]) {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc('place_order', { _order: order, _items: items });

  if (error) throw new Error(error.message || 'Failed to place order');

  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; order_number: string }
    | undefined;
  if (!row?.id) throw new Error('Order could not be created. Please try again.');

  return row;
}
