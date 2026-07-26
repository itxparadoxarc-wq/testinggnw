-- Internal cost/margin data must not be reachable through the public Data API.
-- Replace table-wide SELECT with column-level grants that exclude cost_price.
REVOKE SELECT ON public.product_variants FROM anon, authenticated;

GRANT SELECT (
  id, product_id, title, sku, barcode, price, compare_at_price,
  inventory_quantity, low_stock_threshold, weight, image_url,
  option_values_json, is_active, created_at
) ON public.product_variants TO anon, authenticated;

-- Admin writes still flow through the "Admins manage variants" policy.
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

-- Server-side/admin processes retain full access including cost_price.
GRANT ALL ON public.product_variants TO service_role;