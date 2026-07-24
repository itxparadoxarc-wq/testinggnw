
-- Update hero slides to point at real GrabnWear campaign images (scraped from grabnwear.store)
UPDATE public.store_settings SET value_json = '[
  {"title":"New Season Drops","subtitle":"Fresh arrivals handpicked for your wardrobe.","cta_text":"View Collection","cta_link":"/collections/new-arrivals","bg":"/__l5e/assets-v1/4a7dcfe5-f3bd-4325-b675-8e74cd80f135/hero-1.jpg"},
  {"title":"Grab Your Style","subtitle":"Trendy streetwear & fashion curated for the bold.","cta_text":"Shop Now","cta_link":"/collections","bg":"/__l5e/assets-v1/e9261d98-8a7e-43b5-8c09-5696128d9305/hero-2.jpg"},
  {"title":"Up to 40% Off","subtitle":"Premium quality at unbeatable prices.","cta_text":"Shop Sale","cta_link":"/collections/on-sale","bg":"/__l5e/assets-v1/c0e88ff3-efb8-44d7-9ce6-8cbfc2b64168/hero-3.jpg"}
]'::jsonb
WHERE key = 'hero_slides';

-- Enable realtime for store_settings so removed slides / disabled payment methods
-- disappear from all live sessions instantly (used by useStoreSettings realtime channel).
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;
END $$;
