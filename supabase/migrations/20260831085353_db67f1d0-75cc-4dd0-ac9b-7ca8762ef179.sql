CREATE OR REPLACE FUNCTION public.place_order(_order jsonb, _items jsonb)
 RETURNS TABLE(id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  new_number text;
  it jsonb;
  v_qty int;
  v_unit numeric;
  v_product_id uuid;
  v_variant_id uuid;
  v_title text;
  v_variant_title text;
  v_image text;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := 0;
  v_ship_req numeric;
  v_max_rate numeric;
  v_total numeric;
  v_code text;
  d public.discounts%ROWTYPE;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  IF coalesce(_order->>'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  -- ---- 1. Server-side pricing: never trust client amounts ----
  CREATE TEMP TABLE _po_items (
    product_id uuid,
    variant_id uuid,
    title text,
    variant_title text,
    quantity int,
    unit_price numeric,
    total_price numeric,
    image_url text
  ) ON COMMIT DROP;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_qty := greatest(coalesce((it->>'quantity')::int, 1), 1);
    IF v_qty > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    v_variant_id := nullif(it->>'variant_id','')::uuid;
    v_product_id := nullif(it->>'product_id','')::uuid;

    IF v_variant_id IS NOT NULL THEN
      SELECT pv.price, pv.product_id, pv.title, coalesce(pv.image_url, '')
        INTO v_unit, v_product_id, v_variant_title, v_image
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = v_variant_id
        AND coalesce(pv.is_active, true)
        AND p.status = 'active';
      IF v_unit IS NULL THEN
        RAISE EXCEPTION 'This item is no longer available';
      END IF;
    ELSIF v_product_id IS NOT NULL THEN
      SELECT min(pv.price) INTO v_unit
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.product_id = v_product_id
        AND coalesce(pv.is_active, true)
        AND p.status = 'active';
      IF v_unit IS NULL THEN
        RAISE EXCEPTION 'This item is no longer available';
      END IF;
      v_variant_title := nullif(it->>'variant_title','');
      v_image := nullif(it->>'image_url','');
    ELSE
      RAISE EXCEPTION 'Each order item must reference a product';
    END IF;

    SELECT p.title INTO v_title FROM public.products p WHERE p.id = v_product_id;
    v_title := coalesce(v_title, 'Item');
    IF v_image IS NULL OR v_image = '' THEN
      SELECT pi.url INTO v_image FROM public.product_images pi
      WHERE pi.product_id = v_product_id
      ORDER BY coalesce(pi.is_featured, false) DESC, coalesce(pi.position, 0) LIMIT 1;
    END IF;

    v_subtotal := v_subtotal + (v_unit * v_qty);

    INSERT INTO _po_items VALUES (
      v_product_id, v_variant_id, v_title, v_variant_title, v_qty, v_unit, v_unit * v_qty, v_image
    );
  END LOOP;

  -- ---- 2. Discount validated server-side ----
  v_code := upper(trim(coalesce(_order->>'discount_code', '')));
  IF v_code <> '' THEN
    SELECT * INTO d FROM public.discounts
    WHERE upper(code) = v_code
      AND coalesce(is_active, true)
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now())
      AND (usage_limit IS NULL OR coalesce(used_count, 0) < usage_limit)
    LIMIT 1;

    IF d.id IS NOT NULL
       AND (d.min_purchase_amount IS NULL OR v_subtotal >= d.min_purchase_amount) THEN
      IF d.type = 'percentage' THEN
        v_discount := round(v_subtotal * least(greatest(d.value, 0), 100) / 100.0, 2);
      ELSIF d.type = 'fixed_amount' THEN
        v_discount := least(greatest(d.value, 0), v_subtotal);
      ELSE
        v_discount := 0; -- free_shipping handled below
      END IF;

      UPDATE public.discounts SET used_count = coalesce(used_count, 0) + 1 WHERE id = d.id;
    ELSE
      d := NULL;
    END IF;
  END IF;

  -- ---- 3. Shipping must match a configured rate ----
  v_ship_req := greatest(coalesce((_order->>'shipping_amount')::numeric, 0), 0);
  IF d.id IS NOT NULL AND d.type = 'free_shipping' THEN
    v_shipping := 0;
  ELSIF v_ship_req = 0 THEN
    v_shipping := 0;
  ELSIF EXISTS (SELECT 1 FROM public.shipping_rates WHERE rate = v_ship_req) THEN
    v_shipping := v_ship_req;
  ELSE
    SELECT coalesce(max(rate), 0) INTO v_max_rate FROM public.shipping_rates;
    v_shipping := least(v_ship_req, v_max_rate);
  END IF;

  v_total := greatest(v_subtotal - v_discount + v_shipping, 0);

  INSERT INTO public.orders (
    user_id, email, subtotal, discount_amount, shipping_amount, tax_amount, total,
    shipping_address_json, billing_address_json, status, payment_status,
    stripe_payment_intent_id, notes
  ) VALUES (
    auth.uid(),
    _order->>'email',
    v_subtotal,
    v_discount,
    v_shipping,
    0,
    v_total,
    _order->'shipping_address_json',
    _order->'billing_address_json',
    coalesce((_order->>'status')::order_status, 'pending'),
    coalesce((_order->>'payment_status')::payment_status, 'pending'),
    _order->>'stripe_payment_intent_id',
    left(coalesce(_order->>'notes', ''), 2000)
  )
  RETURNING orders.id, orders.order_number INTO new_id, new_number;

  INSERT INTO public.order_items (
    order_id, product_id, variant_id, title, variant_title, quantity, unit_price, total_price, image_url
  )
  SELECT new_id, product_id, variant_id, title, variant_title, quantity, unit_price, total_price, image_url
  FROM _po_items;

  INSERT INTO public.order_timeline (order_id, event, description)
  VALUES (new_id, 'Order placed', coalesce(left(_order->>'timeline_note', 500), 'Order ' || new_number || ' placed'));

  DROP TABLE IF EXISTS _po_items;

  RETURN QUERY SELECT new_id, new_number;
END;
$function$;