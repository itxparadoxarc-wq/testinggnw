DO $$
DECLARE
  rec record;
  pid uuid;
  sz text;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('Oversized Linen Shirt','oversized-linen-shirt','/media/gen-shirt-linen.jpg','/media/22fbae21-p-tee-white.jpg','t-shirts',4200,5600),
      ('Signature Leather Jacket','signature-leather-jacket','/media/gen-jacket-leather.jpg','/media/e6b28369-p-bomber-olive.jpg','jackets',18900,22900),
      ('Heavyweight Jogger','heavyweight-jogger','/media/gen-joggers-grey.jpg','/media/c6284dca-p-cargo.jpg','hoodies',5400,6900),
      ('Cable Knit Sweater','cable-knit-sweater','/media/gen-sweater-cream.jpg','/media/aa9ff926-p-hoodie-cream.jpg','hoodies',7900,9900),
      ('Pique Polo Navy','pique-polo-navy','/media/gen-polo-navy.jpg','/media/22fbae21-p-tee-white.jpg','t-shirts',3900,4900),
      ('Core Logo Cap','core-logo-cap','/media/gen-cap-black.jpg','/media/82f1f553-p-bag.jpg','accessories',2200,2900),
      ('Essential Black Tee','essential-black-tee','/media/f8538f61-p-tee-graphic.jpg','/media/22fbae21-p-tee-white.jpg','t-shirts',2900,3900),
      ('Stone Wash Denim','stone-wash-denim','/media/1c843d6b-p-jeans-indigo.jpg','/media/c6284dca-p-cargo.jpg','denim',6900,8900),
      ('Court Sneaker Mono','court-sneaker-mono','/media/8b2c8a19-p-sneaker-black.jpg','/media/5b0a2dc7-p-sneaker-white.jpg','sneakers',11900,14900),
      ('Studio Hoodie Black','studio-hoodie-black','/media/7d8a7b4a-p-hoodie-black.jpg','/media/aa9ff926-p-hoodie-cream.jpg','hoodies',6400,7900),
      ('Everyday Tote','everyday-tote','/media/82f1f553-p-bag.jpg','/media/d2f664ca-p-watch.jpg','accessories',4500,5900),
      ('Summer Slip Dress','summer-slip-dress','/media/c3a8def0-p-dress.jpg','/media/22fbae21-p-tee-white.jpg','t-shirts',8200,9900)
    ) AS t(title,slug,img1,img2,cat,price,cmp)
  LOOP
    IF EXISTS (SELECT 1 FROM products WHERE slug = rec.slug) THEN CONTINUE; END IF;
    INSERT INTO products (title, slug, description_html, status, product_type, vendor, tags, category_id, seo_title, seo_description, requires_shipping)
    VALUES (rec.title, rec.slug,
      '<p>' || rec.title || ' — crafted from premium materials with a considered fit and finish. Designed for everyday wear, built to last.</p>',
      'active', rec.cat, 'GrabNWear', ARRAY['new','featured'],
      (SELECT id FROM categories WHERE slug = rec.cat),
      rec.title || ' | GrabNWear', 'Shop the ' || rec.title || ' at GrabNWear.', true)
    RETURNING id INTO pid;

    INSERT INTO product_images (product_id, url, alt_text, position, is_featured)
    VALUES (pid, rec.img1, rec.title, 0, true), (pid, rec.img2, rec.title || ' alternate', 1, false);

    FOREACH sz IN ARRAY ARRAY['S','M','L','XL'] LOOP
      INSERT INTO product_variants (product_id, title, sku, price, compare_at_price, inventory_quantity, low_stock_threshold, option_values_json, image_url, is_active)
      VALUES (pid, sz, upper(replace(rec.slug,'-','')) || '-' || sz, rec.price, rec.cmp, 25, 5, jsonb_build_object('Size', sz), rec.img1, true);
    END LOOP;
  END LOOP;
END $$;