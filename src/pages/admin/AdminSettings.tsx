import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Store, Palette, CreditCard, Bell, Truck, Image, Plus, Trash2, GripVertical, Upload, Loader2 } from 'lucide-react';
import { invalidateStoreSettings } from '@/hooks/useStoreSettings';

interface HeroSlide {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  bg: string;
}

interface TrustBadge {
  label: string;
  desc: string;
}

const AdminSettings = () => {
  const [storeName, setStoreName] = useState('GrabnWear');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeLocation, setStoreLocation] = useState('Lahore, Punjab, Pakistan');
  const [currency, setCurrency] = useState('PKR');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [saving, setSaving] = useState(false);

  // Theme
  const [primaryColor, setPrimaryColor] = useState('280 60% 35%');
  const [fontDisplay, setFontDisplay] = useState('Playfair Display');
  const [fontBody, setFontBody] = useState('Space Grotesk');
  const [borderRadius, setBorderRadius] = useState('0.625rem');

  // Payment
  const [codEnabled, setCodEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [jazzcashEnabled, setJazzcashEnabled] = useState(false);
  const [easypaisaEnabled, setEasypaisaEnabled] = useState(false);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [jazzcashAccount, setJazzcashAccount] = useState('');
  const [jazzcashAccountName, setJazzcashAccountName] = useState('');
  const [easypaisaAccount, setEasypaisaAccount] = useState('');
  const [easypaisaAccountName, setEasypaisaAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountTitle, setBankAccountTitle] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('3000');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  // Notification settings
  const [notifyOrderConfirmation, setNotifyOrderConfirmation] = useState(true);
  const [notifyStatusUpdates, setNotifyStatusUpdates] = useState(true);
  const [notifyAdminOnOrder, setNotifyAdminOnOrder] = useState(true);
  const [notifyAdminOnStatus, setNotifyAdminOnStatus] = useState(true);
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('');

  // Footer & Social
  const [footerTagline, setFooterTagline] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');

  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    { title: 'Grab Your Style', subtitle: 'Trendy streetwear & fashion curated for the bold.', cta_text: 'Shop Now', cta_link: '/collections', bg: '/__l5e/assets-v1/4a7dcfe5-f3bd-4325-b675-8e74cd80f135/hero-1.jpg' },
    { title: 'New Season Drops', subtitle: 'Fresh arrivals handpicked for your wardrobe.', cta_text: 'View Collection', cta_link: '/collections/new-arrivals', bg: '/__l5e/assets-v1/e9261d98-8a7e-43b5-8c09-5696128d9305/hero-2.jpg' },
    { title: 'Up to 40% Off', subtitle: "Premium quality at unbeatable prices.", cta_text: 'Shop Sale', cta_link: '/collections/on-sale', bg: '/__l5e/assets-v1/c0e88ff3-efb8-44d7-9ce6-8cbfc2b64168/hero-3.jpg' },
  ]);

  // Trust Badges
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([
    { label: 'Free Delivery', desc: 'All over Pakistan' },
    { label: 'Easy Returns', desc: '7-day return policy' },
    { label: 'Secure Checkout', desc: 'SSL encrypted' },
    { label: 'COD Available', desc: 'Cash on delivery' },
  ]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('store_settings').select('key, value_json');
      (data || []).forEach((s: any) => {
        const v = s.value_json;
        if (!v) return;
        switch (s.key) {
          case 'store_name': setStoreName(v as string); break;
          case 'store_email': setStoreEmail(v as string); break;
          case 'store_phone': setStorePhone(v as string); break;
          case 'store_location': setStoreLocation(v as string); break;
          case 'currency': setCurrency(v as string); break;
          case 'announcement':
            setAnnouncementText((v as any).text || '');
            setAnnouncementActive((v as any).is_active || false);
            break;
          case 'theme': {
            const t = v as any;
            if (t.primary_color) setPrimaryColor(t.primary_color);
            if (t.font_display) setFontDisplay(t.font_display);
            if (t.font_body) setFontBody(t.font_body);
            if (t.border_radius) setBorderRadius(t.border_radius);
            break;
          }
          case 'payment_methods': {
            const p = v as any;
            if (p.cod !== undefined) setCodEnabled(p.cod);
            if (p.stripe !== undefined) setStripeEnabled(p.stripe);
            if (p.jazzcash !== undefined) setJazzcashEnabled(p.jazzcash);
            if (p.easypaisa !== undefined) setEasypaisaEnabled(p.easypaisa);
            if (p.bank_transfer !== undefined) setBankTransferEnabled(p.bank_transfer);
            if (p.jazzcash_account) setJazzcashAccount(p.jazzcash_account);
            if (p.jazzcash_account_name) setJazzcashAccountName(p.jazzcash_account_name);
            if (p.easypaisa_account) setEasypaisaAccount(p.easypaisa_account);
            if (p.easypaisa_account_name) setEasypaisaAccountName(p.easypaisa_account_name);
            if (p.bank_name) setBankName(p.bank_name);
            if (p.bank_account_title) setBankAccountTitle(p.bank_account_title);
            if (p.bank_account_number) setBankAccountNumber(p.bank_account_number);
            if (p.bank_iban) setBankIban(p.bank_iban);
            break;
          }
          case 'shipping_config':
            if ((v as any).free_shipping_threshold) setFreeShippingThreshold((v as any).free_shipping_threshold);
            if ((v as any).shipping_policy) setShippingPolicy((v as any).shipping_policy);
            if ((v as any).return_policy) setReturnPolicy((v as any).return_policy);
            break;
          case 'notification_settings':
            if ((v as any).order_confirmation !== undefined) setNotifyOrderConfirmation((v as any).order_confirmation);
            if ((v as any).status_updates !== undefined) setNotifyStatusUpdates((v as any).status_updates);
            if ((v as any).admin_on_order !== undefined) setNotifyAdminOnOrder((v as any).admin_on_order);
            if ((v as any).admin_on_status !== undefined) setNotifyAdminOnStatus((v as any).admin_on_status);
            if ((v as any).admin_email) setAdminNotificationEmail((v as any).admin_email);
            break;
          case 'footer':
            if ((v as any).tagline) setFooterTagline((v as any).tagline);
            break;
          case 'social_links': {
            const sl = v as any;
            if (sl.instagram) setSocialInstagram(sl.instagram);
            if (sl.facebook) setSocialFacebook(sl.facebook);
            if (sl.whatsapp) setSocialWhatsapp(sl.whatsapp);
            break;
          }
          case 'hero_slides':
            if (Array.isArray(v) && v.length > 0) setHeroSlides(v as HeroSlide[]);
            break;
          case 'trust_badges':
            if (Array.isArray(v) && v.length > 0) setTrustBadges(v as TrustBadge[]);
            break;
        }
      });
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const { data: existing } = await supabase.from('store_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('store_settings').update({ value_json: value }).eq('key', key);
    } else {
      await supabase.from('store_settings').insert({ key, value_json: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('store_name', storeName),
        saveSetting('store_email', storeEmail),
        saveSetting('store_phone', storePhone),
        saveSetting('store_location', storeLocation),
        saveSetting('currency', currency),
        saveSetting('announcement', { text: announcementText, is_active: announcementActive }),
        saveSetting('theme', { primary_color: primaryColor, font_display: fontDisplay, font_body: fontBody, border_radius: borderRadius }),
        saveSetting('payment_methods', {
          cod: codEnabled, stripe: stripeEnabled, jazzcash: jazzcashEnabled, easypaisa: easypaisaEnabled,
          bank_transfer: bankTransferEnabled, jazzcash_account: jazzcashAccount, jazzcash_account_name: jazzcashAccountName,
          easypaisa_account: easypaisaAccount, easypaisa_account_name: easypaisaAccountName,
          bank_name: bankName, bank_account_title: bankAccountTitle, bank_account_number: bankAccountNumber, bank_iban: bankIban,
        }),
        saveSetting('shipping_config', { free_shipping_threshold: freeShippingThreshold, shipping_policy: shippingPolicy, return_policy: returnPolicy }),
        saveSetting('footer', { tagline: footerTagline }),
        saveSetting('social_links', { instagram: socialInstagram, facebook: socialFacebook, whatsapp: socialWhatsapp }),
        saveSetting('hero_slides', heroSlides),
        saveSetting('trust_badges', trustBadges),
        saveSetting('notification_settings', {
          order_confirmation: notifyOrderConfirmation, status_updates: notifyStatusUpdates,
          admin_on_order: notifyAdminOnOrder, admin_on_status: notifyAdminOnStatus,
          admin_email: adminNotificationEmail,
        }),
      ]);
      invalidateStoreSettings();
      toast.success('All settings saved successfully! Refresh the storefront to see changes.');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const updateSlide = (index: number, field: keyof HeroSlide, value: string) => {
    setHeroSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    setHeroSlides(prev => [...prev, { title: 'New Slide', subtitle: 'Description here', cta_text: 'Shop Now', cta_link: '/collections', bg: '/__l5e/assets-v1/4a7dcfe5-f3bd-4325-b675-8e74cd80f135/hero-1.jpg' }]);
  };

  const removeSlide = (index: number) => {
    setHeroSlides(prev => prev.filter((_, i) => i !== index));
  };

  const updateBadge = (index: number, field: keyof TrustBadge, value: string) => {
    setTrustBadges(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5"><Store className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="hero" className="gap-1.5"><Image className="h-3.5 w-3.5" /> Hero Slides</TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5"><Truck className="h-3.5 w-3.5" /> Shipping</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Information</CardTitle>
              <CardDescription>Basic details about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Store Name</Label><Input value={storeName} onChange={e => setStoreName(e.target.value)} className="mt-1" /></div>
              <div><Label>Contact Email</Label><Input type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} placeholder="support@grabnwear.pk" className="mt-1" /></div>
              <div><Label>Phone / WhatsApp</Label><Input value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="+92 300 1234567" className="mt-1" /></div>
              <div><Label>Business Location</Label><Input value={storeLocation} onChange={e => setStoreLocation(e.target.value)} placeholder="Lahore, Punjab, Pakistan" className="mt-1" /></div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR (Rs.)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Instagram URL</Label><Input value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/grabnwear" className="mt-1" /></div>
              <div><Label>Facebook URL</Label><Input value={socialFacebook} onChange={e => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/grabnwear" className="mt-1" /></div>
              <div><Label>WhatsApp Number</Label><Input value={socialWhatsapp} onChange={e => setSocialWhatsapp(e.target.value)} placeholder="+923001234567" className="mt-1" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Footer</CardTitle>
              <CardDescription>Customize footer text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Tagline / Description</Label><Textarea value={footerTagline} onChange={e => setFooterTagline(e.target.value)} rows={2} placeholder="Pakistan's trendiest online fashion store." className="mt-1" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trust Badges</CardTitle>
              <CardDescription>Edit the trust badges shown below the hero</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input value={badge.label} onChange={e => updateBadge(i, 'label', e.target.value)} placeholder="Label" />
                    <Input value={badge.desc} onChange={e => updateBadge(i, 'desc', e.target.value)} placeholder="Description" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Slides */}
        <TabsContent value="hero" className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Hero Carousel Slides
                <Button size="sm" variant="outline" onClick={addSlide}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Slide
                </Button>
              </CardTitle>
              <CardDescription>Manage the hero banner slides on your homepage. Each slide has an image, title, subtitle, and call-to-action button.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {heroSlides.map((slide, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Slide {i + 1}</span>
                    </div>
                    {heroSlides.length > 1 && (
                      <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => removeSlide(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                    <img src={slide.bg} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center p-4">
                      <div>
                        <p className="text-white font-display text-lg">{slide.title}</p>
                        <p className="text-white/70 text-xs">{slide.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Slide Image</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={slide.bg} onChange={e => updateSlide(i, 'bg', e.target.value)} placeholder="/__l5e/assets-v1/4a7dcfe5-f3bd-4325-b675-8e74cd80f135/hero-1.jpg or https://..." className="text-xs flex-1" />
                        <HeroImageUpload slideIndex={i} onUploaded={(url) => updateSlide(i, 'bg', url)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Input value={slide.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Button Text</Label>
                      <Input value={slide.cta_text} onChange={e => updateSlide(i, 'cta_text', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Button Link</Label>
                      <Input value={slide.cta_link} onChange={e => updateSlide(i, 'cta_link', e.target.value)} placeholder="/collections" className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="theme" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Theme & Branding</CardTitle>
              <CardDescription>Customize the look and feel of your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Color (HSL)</Label>
                <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="280 60% 35%" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Format: hue saturation% lightness% (e.g., 280 60% 35%)</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: `hsl(${primaryColor})` }} />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              </div>
              <div>
                <Label>Display Font</Label>
                <Select value={fontDisplay} onValueChange={setFontDisplay}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Merriweather">Merriweather</SelectItem>
                    <SelectItem value="Lora">Lora</SelectItem>
                    <SelectItem value="Prata">Prata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body Font</Label>
                <Select value={fontBody} onValueChange={setFontBody}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="DM Sans">DM Sans</SelectItem>
                    <SelectItem value="Nunito Sans">Nunito Sans</SelectItem>
                    <SelectItem value="Work Sans">Work Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Border Radius</Label>
                <Select value={borderRadius} onValueChange={setBorderRadius}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sharp (0)</SelectItem>
                    <SelectItem value="0.375rem">Subtle (0.375rem)</SelectItem>
                    <SelectItem value="0.625rem">Default (0.625rem)</SelectItem>
                    <SelectItem value="1rem">Rounded (1rem)</SelectItem>
                    <SelectItem value="9999px">Pill (full)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Announcement Bar</CardTitle>
              <CardDescription>Show a message at the top of your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                <Label>Show announcement bar</Label>
              </div>
              <div><Label>Message</Label><Textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} rows={2} placeholder="🚚 Free delivery on orders above Rs. 3,000!" className="mt-1" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
              <CardDescription>Enable or disable payment options. Enabled methods will show on checkout and footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* COD */}
              <div className={`p-4 rounded-xl border transition-colors ${codEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/__l5e/assets-v1/0c8414fb-15e4-49d0-835a-3e185843e440/payment-cod.png" alt="COD" className="h-8 w-auto object-contain" />
                    <div>
                      <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                      <p className="text-xs text-muted-foreground">Customers pay when order is delivered</p>
                    </div>
                  </div>
                  <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
                </div>
              </div>

              {/* Stripe */}
              <div className={`p-4 rounded-xl border transition-colors ${stripeEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="text-sm font-medium">Credit / Debit Card (Stripe)</p>
                      <p className="text-xs text-muted-foreground">Accept Visa, Mastercard online</p>
                    </div>
                  </div>
                  <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
                </div>
              </div>

              {/* JazzCash */}
              <div className={`p-4 rounded-xl border transition-colors ${jazzcashEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/__l5e/assets-v1/87908764-5adb-4d14-988d-dec005844eb7/payment-jazzcash.png" alt="JazzCash" className="h-8 w-auto object-contain" />
                    <div>
                      <p className="text-sm font-medium">JazzCash</p>
                      <p className="text-xs text-muted-foreground">Mobile wallet payments</p>
                    </div>
                  </div>
                  <Switch checked={jazzcashEnabled} onCheckedChange={setJazzcashEnabled} />
                </div>
                {jazzcashEnabled && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div>
                      <Label className="text-xs">Account Holder Name</Label>
                      <Input value={jazzcashAccountName} onChange={e => setJazzcashAccountName(e.target.value)} placeholder="Muhammad Ali" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">JazzCash Account Number</Label>
                      <Input value={jazzcashAccount} onChange={e => setJazzcashAccount(e.target.value)} placeholder="03XX-XXXXXXX" className="mt-1 h-8 text-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">These details will be shown to customers at checkout</p>
                  </div>
                )}
              </div>

              {/* EasyPaisa */}
              <div className={`p-4 rounded-xl border transition-colors ${easypaisaEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/__l5e/assets-v1/e7e406c5-5c12-46aa-866f-773f7dec3fd1/payment-easypaisa.png" alt="EasyPaisa" className="h-8 w-auto object-contain" />
                    <div>
                      <p className="text-sm font-medium">EasyPaisa</p>
                      <p className="text-xs text-muted-foreground">Mobile wallet payments</p>
                    </div>
                  </div>
                  <Switch checked={easypaisaEnabled} onCheckedChange={setEasypaisaEnabled} />
                </div>
                {easypaisaEnabled && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div>
                      <Label className="text-xs">Account Holder Name</Label>
                      <Input value={easypaisaAccountName} onChange={e => setEasypaisaAccountName(e.target.value)} placeholder="Muhammad Ali" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">EasyPaisa Account Number</Label>
                      <Input value={easypaisaAccount} onChange={e => setEasypaisaAccount(e.target.value)} placeholder="03XX-XXXXXXX" className="mt-1 h-8 text-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">These details will be shown to customers at checkout</p>
                  </div>
                )}
              </div>

              {/* Bank Transfer */}
              <div className={`p-4 rounded-xl border transition-colors ${bankTransferEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <p className="text-sm font-medium">Bank Transfer</p>
                      <p className="text-xs text-muted-foreground">Direct bank account transfer</p>
                    </div>
                  </div>
                  <Switch checked={bankTransferEnabled} onCheckedChange={setBankTransferEnabled} />
                </div>
                {bankTransferEnabled && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div>
                      <Label className="text-xs">Bank Name</Label>
                      <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Meezan Bank" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Account Title</Label>
                      <Input value={bankAccountTitle} onChange={e => setBankAccountTitle(e.target.value)} placeholder="Account holder name" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Account Number</Label>
                      <Input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="XXXX-XXXXXXXX" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">IBAN (optional)</Label>
                      <Input value={bankIban} onChange={e => setBankIban(e.target.value)} placeholder="PK..." className="mt-1 h-8 text-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">These details will be shown to customers who choose bank transfer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping */}
        <TabsContent value="shipping" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Configuration</CardTitle>
              <CardDescription>Set up delivery options for Pakistan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Free Shipping Threshold (Rs.)</Label>
                <Input type="number" value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} placeholder="3000" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Orders above this amount get free delivery</p>
              </div>
              <div>
                <Label>Shipping Policy</Label>
                <Textarea value={shippingPolicy} onChange={e => setShippingPolicy(e.target.value)} rows={3} placeholder="Shipping information displayed on product pages" className="mt-1" />
              </div>
              <div>
                <Label>Return Policy</Label>
                <Textarea value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} rows={3} placeholder="Return policy displayed on product pages" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Notifications</CardTitle>
              <CardDescription>Configure which emails are sent automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Order Confirmation (Customer)</p>
                  <p className="text-xs text-muted-foreground">Send email when order is placed</p>
                </div>
                <Switch checked={notifyOrderConfirmation} onCheckedChange={setNotifyOrderConfirmation} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Status Updates (Customer)</p>
                  <p className="text-xs text-muted-foreground">Send email on order status changes</p>
                </div>
                <Switch checked={notifyStatusUpdates} onCheckedChange={setNotifyStatusUpdates} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">New Order Alert (Admin)</p>
                  <p className="text-xs text-muted-foreground">Notify admin on new orders</p>
                </div>
                <Switch checked={notifyAdminOnOrder} onCheckedChange={setNotifyAdminOnOrder} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Status Change Alert (Admin)</p>
                  <p className="text-xs text-muted-foreground">Notify admin on status changes</p>
                </div>
                <Switch checked={notifyAdminOnStatus} onCheckedChange={setNotifyAdminOnStatus} />
              </div>
              <div>
                <Label>Admin Notification Email</Label>
                <Input type="email" value={adminNotificationEmail} onChange={e => setAdminNotificationEmail(e.target.value)} placeholder="admin@grabnwear.pk" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Email address for admin notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Hero Image Upload Component
const HeroImageUpload = ({ slideIndex, onUploaded }: { slideIndex: number; onUploaded: (url: string) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `hero/hero-slide-${slideIndex}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    onUploaded(urlData.publicUrl);
    toast.success('Image uploaded!');
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <Button type="button" size="sm" variant="outline" className="shrink-0 h-9 gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
    </>
  );
};

export default AdminSettings;
