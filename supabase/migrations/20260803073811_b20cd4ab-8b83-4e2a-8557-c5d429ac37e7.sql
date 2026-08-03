CREATE OR REPLACE FUNCTION public.place_order(_order jsonb, _items jsonb)
RETURNS TABLE (id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  new_number text;
  it jsonb;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  IF coalesce(_order->>'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  INSERT INTO public.orders (
    user_id, email, subtotal, discount_amount, shipping_amount, tax_amount, total,
    shipping_address_json, billing_address_json, status, payment_status,
    stripe_payment_intent_id, notes
  ) VALUES (
    auth.uid(),
    _order->>'email',
    coalesce((_order->>'subtotal')::numeric, 0),
    coalesce((_order->>'discount_amount')::numeric, 0),
    coalesce((_order->>'shipping_amount')::numeric, 0),
    coalesce((_order->>'tax_amount')::numeric, 0),
    coalesce((_order->>'total')::numeric, 0),
    _order->'shipping_address_json',
    _order->'billing_address_json',
    coalesce((_order->>'status')::order_status, 'pending'),
    coalesce((_order->>'payment_status')::payment_status, 'pending'),
    _order->>'stripe_payment_intent_id',
    _order->>'notes'
  )
  RETURNING orders.id, orders.order_number INTO new_id, new_number;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, title, variant_title, quantity, unit_price, total_price, image_url
    ) VALUES (
      new_id,
      nullif(it->>'product_id','')::uuid,
      nullif(it->>'variant_id','')::uuid,
      coalesce(it->>'title','Item'),
      it->>'variant_title',
      greatest(coalesce((it->>'quantity')::int, 1), 1),
      coalesce((it->>'unit_price')::numeric, 0),
      coalesce((it->>'total_price')::numeric, 0),
      it->>'image_url'
    );
  END LOOP;

  INSERT INTO public.order_timeline (order_id, event, description)
  VALUES (new_id, 'Order placed', coalesce(_order->>'timeline_note', 'Order ' || new_number || ' placed'));

  RETURN QUERY SELECT new_id, new_number;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated, service_role;