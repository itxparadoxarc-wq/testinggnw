import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_location: string;
  currency: string;
  announcement: { text: string; is_active: boolean };
  theme: { primary_color: string; font_display: string; font_body: string; border_radius: string };
  payment_methods: {
    cod: boolean; stripe: boolean; jazzcash: boolean; easypaisa: boolean;
    bank_transfer: boolean; jazzcash_account: string; jazzcash_account_name: string;
    easypaisa_account: string; easypaisa_account_name: string;
    bank_name: string; bank_account_title: string; bank_account_number: string; bank_iban: string;
  };
  shipping_config: { free_shipping_threshold: string };
  footer: { tagline: string };
  social_links: { instagram: string; facebook: string; whatsapp: string };
  hero_slides: Array<{ title: string; subtitle: string; cta_text: string; cta_link: string; bg: string }>;
  trust_badges: Array<{ label: string; desc: string }>;
}

const defaults: StoreSettings = {
  store_name: 'GrabnWear',
  store_email: 'hello@grabnwear.com',
  store_phone: '+92 318 7166226',
  store_location: 'Lahore, Punjab, Pakistan',
  currency: 'PKR',
  announcement: { text: '🚚 Free delivery on orders above {threshold}!', is_active: true },
  theme: { primary_color: '280 60% 35%', font_display: 'Playfair Display', font_body: 'Space Grotesk', border_radius: '0.625rem' },
  payment_methods: {
    cod: true, stripe: false, jazzcash: false, easypaisa: false,
    bank_transfer: false, jazzcash_account: '', jazzcash_account_name: '',
    easypaisa_account: '', easypaisa_account_name: '',
    bank_name: '', bank_account_title: '', bank_account_number: '', bank_iban: '',
  },
  shipping_config: { free_shipping_threshold: '3000' },
  footer: { tagline: 'Grab your style. Wear your confidence. Trendy fashion & streetwear for Pakistan and beyond.' },
  social_links: { instagram: '', facebook: '', whatsapp: '' },
  hero_slides: [
    { title: 'New Season Drops', subtitle: 'Fresh arrivals handpicked for your wardrobe.', cta_text: 'View Collection', cta_link: '/collections/new-arrivals', bg: '/__l5e/assets-v1/4a7dcfe5-f3bd-4325-b675-8e74cd80f135/hero-1.jpg' },
    { title: 'Grab Your Style', subtitle: 'Trendy streetwear & fashion curated for the bold.', cta_text: 'Shop Now', cta_link: '/collections', bg: '/__l5e/assets-v1/e9261d98-8a7e-43b5-8c09-5696128d9305/hero-2.jpg' },
    { title: 'Up to 40% Off', subtitle: 'Premium quality at unbeatable prices.', cta_text: 'Shop Sale', cta_link: '/collections/on-sale', bg: '/__l5e/assets-v1/c0e88ff3-efb8-44d7-9ce6-8cbfc2b64168/hero-3.jpg' },
  ],
  trust_badges: [
    { label: 'Free Delivery', desc: 'All over Pakistan' },
    { label: 'Easy Returns', desc: '7-day return policy' },
    { label: 'Secure Checkout', desc: 'SSL encrypted' },
    { label: 'COD Available', desc: 'Cash on delivery' },
  ],
};

let cachedSettings: StoreSettings | null = null;
let fetchPromise: Promise<StoreSettings> | null = null;

async function fetchSettings(): Promise<StoreSettings> {
  const { data } = await supabase.from('store_settings').select('key, value_json');
  const settings = { ...defaults };
  (data || []).forEach((s: any) => {
    const v = s.value_json;
    if (!v) return;
    switch (s.key) {
      case 'store_name': settings.store_name = v as string; break;
      case 'store_email': settings.store_email = v as string; break;
      case 'store_phone': settings.store_phone = v as string; break;
      case 'store_location': settings.store_location = v as string; break;
      case 'currency': settings.currency = v as string; break;
      case 'announcement': settings.announcement = { ...defaults.announcement, ...(v as any) }; break;
      case 'theme': settings.theme = { ...defaults.theme, ...(v as any) }; break;
      case 'payment_methods': settings.payment_methods = { ...defaults.payment_methods, ...(v as any) }; break;
      case 'shipping_config': settings.shipping_config = { ...defaults.shipping_config, ...(v as any) }; break;
      case 'footer': settings.footer = { ...defaults.footer, ...(v as any) }; break;
      case 'social_links': settings.social_links = { ...defaults.social_links, ...(v as any) }; break;
      case 'hero_slides': if (Array.isArray(v) && v.length > 0) settings.hero_slides = v as any; break;
      case 'trust_badges': if (Array.isArray(v) && v.length > 0) settings.trust_badges = v as any; break;
    }
  });
  return settings;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cachedSettings || defaults);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!fetchPromise) fetchPromise = fetchSettings();
      const s = await fetchPromise;
      cachedSettings = s;
      if (mounted) { setSettings(s); setLoading(false); }
    };
    load();

    // Realtime: when any store_settings row changes (admin save), refetch so
    // removed hero slides / payment icons disappear from live sessions immediately.
    const channel = supabase
      .channel(`store_settings_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'store_settings' }, async () => {
        fetchPromise = null;
        const s = await fetchSettings();
        cachedSettings = s;
        if (mounted) setSettings(s);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const refresh = async () => {
    fetchPromise = null;
    cachedSettings = null;
    const s = await fetchSettings();
    cachedSettings = s;
    setSettings(s);
  };

  return { settings, loading, refresh };
}

export function invalidateStoreSettings() {
  cachedSettings = null;
  fetchPromise = null;
}
