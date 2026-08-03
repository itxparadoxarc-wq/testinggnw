import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, Lock, ShoppingBag, Truck, CreditCard, Check, AlertCircle, Upload, MessageCircle, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { sendOrderConfirmationEmail } from '@/lib/email-client';

const stripePromise = loadStripe('pk_test_51T8hkcDw5g52An4nMi3WhMUq0T1CPKftWWbaN6UVwi7e4AGWlNd0WknDAtp1dg19gqQuQhaD5CFf7rrWdeaFPyPN00yHkXjnvq');

type Step = 'information' | 'shipping' | 'payment';

interface AddressForm {
  email: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  estimated_days: string | null;
}

const emptyAddress: AddressForm = {
  email: '', firstName: '', lastName: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'PK', phone: '',
};

const STEPS: Step[] = ['information', 'shipping', 'payment'];
const STEP_LABELS: Record<Step, string> = { information: 'Information', shipping: 'Shipping', payment: 'Payment' };
const STEP_ICONS: Record<Step, typeof ShoppingBag> = { information: ShoppingBag, shipping: Truck, payment: CreditCard };

// Stripe Payment Form Component
const StripePaymentForm = ({
  onSuccess,
  onError,
  processing,
  setProcessing,
  orderTotal,
}: {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
  orderTotal: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout/success',
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <Button type="submit" disabled={!stripe || processing} className="w-full min-w-[160px]">
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Processing…
          </span>
        ) : (
          `Pay ${formatPrice(orderTotal)}`
        )}
      </Button>
    </form>
  );
};

const AddressFields = ({
  addr, setAddr, showEmail = false, prefix = '',
}: { addr: AddressForm; setAddr: (a: AddressForm) => void; showEmail?: boolean; prefix?: string }) => (
  <div className="space-y-3 sm:space-y-4">
    {showEmail && (
      <div>
        <Label htmlFor={`${prefix}email`}>Email *</Label>
        <Input id={`${prefix}email`} type="email" value={addr.email} onChange={e => setAddr({ ...addr, email: e.target.value })} placeholder="you@example.com" />
      </div>
    )}
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div><Label htmlFor={`${prefix}firstName`}>First Name *</Label><Input id={`${prefix}firstName`} value={addr.firstName} onChange={e => setAddr({ ...addr, firstName: e.target.value })} /></div>
      <div><Label htmlFor={`${prefix}lastName`}>Last Name *</Label><Input id={`${prefix}lastName`} value={addr.lastName} onChange={e => setAddr({ ...addr, lastName: e.target.value })} /></div>
    </div>
    <div>
      <Label htmlFor={`${prefix}address1`}>Address *</Label>
      <Input id={`${prefix}address1`} value={addr.addressLine1} onChange={e => setAddr({ ...addr, addressLine1: e.target.value })} placeholder="Street address" />
    </div>
    <div>
      <Label htmlFor={`${prefix}address2`}>Apartment, suite, etc.</Label>
      <Input id={`${prefix}address2`} value={addr.addressLine2} onChange={e => setAddr({ ...addr, addressLine2: e.target.value })} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
      <div><Label htmlFor={`${prefix}city`}>City *</Label><Input id={`${prefix}city`} value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} /></div>
      <div><Label htmlFor={`${prefix}state`}>Province *</Label><Input id={`${prefix}state`} value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} /></div>
      <div><Label htmlFor={`${prefix}zip`}>Postal Code *</Label><Input id={`${prefix}zip`} value={addr.postalCode} onChange={e => setAddr({ ...addr, postalCode: e.target.value })} /></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      <div>
        <Label htmlFor={`${prefix}country`}>Country</Label>
        <Select value={addr.country} onValueChange={v => setAddr({ ...addr, country: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PK">Pakistan</SelectItem>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="CA">Canada</SelectItem>
            <SelectItem value="GB">United Kingdom</SelectItem>
            <SelectItem value="AU">Australia</SelectItem>
            <SelectItem value="AE">UAE</SelectItem>
            <SelectItem value="SA">Saudi Arabia</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label htmlFor={`${prefix}phone`}>Phone</Label><Input id={`${prefix}phone`} type="tel" value={addr.phone} onChange={e => setAddr({ ...addr, phone: e.target.value })} /></div>
    </div>
  </div>
);

const CheckoutPage = () => {
  const { items, subtotal, discountAmount, discountCode, discountType, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const pm = settings.payment_methods;

  const [step, setStep] = useState<Step>('information');
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState<AddressForm>(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [shippingCost, setShippingCost] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod' | 'jazzcash' | 'easypaisa'>(pm.cod ? 'cod' : pm.jazzcash ? 'jazzcash' : pm.easypaisa ? 'easypaisa' : pm.stripe ? 'stripe' : 'cod');
  const [mobilePaymentTid, setMobilePaymentTid] = useState('TID-');
  const [mobilePaymentSlip, setMobilePaymentSlip] = useState<File | null>(null);
  const [mobilePaymentSlipUrl, setMobilePaymentSlipUrl] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [mobilePaymentSubmitted, setMobilePaymentSubmitted] = useState(false);

  const buildWhatsAppUrl = (orderNumber: string, paymentInfo: string) => {
    const whatsappNumber = settings.social_links.whatsapp?.replace(/[^0-9]/g, '') || '923187166226';
    const itemLines = items.map(i => `• ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ''} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join('\n');
    const addr = shippingAddress;
    const addrLine = `${addr.firstName} ${addr.lastName}, ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}`;
    const msg = [
      `🛒 *New Order — ${orderNumber}*`,
      ``,
      `*Items:*`,
      itemLines,
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      discountAmount > 0 ? `Discount: -${formatPrice(discountAmount)}` : '',
      shippingCost > 0 ? `Shipping: ${formatPrice(shippingCost)}` : 'Shipping: Free',
      `*Total: ${formatPrice(orderTotal)}*`,
      ``,
      `💳 Payment: ${paymentInfo}`,
      `📦 Deliver to: ${addrLine}`,
      addr.phone ? `📞 Phone: ${addr.phone}` : '',
      `📧 Email: ${addr.email}`,
      ``,
      `Please confirm my order. Thank you! 🙏`,
    ].filter(Boolean).join('\n');
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        email: user.email || '',
        firstName: profile?.full_name?.split(' ')[0] || '',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        phone: profile?.phone || '',
      }));
    }
  }, [user, profile]);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      .then(({ data }) => {
        setSavedAddresses(data || []);
        const def = data?.find((a: any) => a.is_default);
        if (def) {
          setShippingAddress(prev => ({
            ...prev,
            firstName: def.first_name,
            lastName: def.last_name,
            addressLine1: def.address_line_1,
            addressLine2: def.address_line_2 || '',
            city: def.city,
            state: def.state,
            postalCode: def.postal_code,
            country: def.country,
          }));
        }
      });
  }, [user]);

  // Load shipping rates
  useEffect(() => {
    supabase.from('shipping_zones').select('id, name, countries_json').then(({ data: zones }) => {
      if (!zones?.length) {
        setShippingRates([{ id: 'free', name: 'Free Shipping', rate: 0, estimated_days: '5-7 business days' }]);
        setSelectedShipping('free');
        return;
      }
      const matchingZone = zones.find((z: any) => {
        const countries = z.countries_json as string[];
        return countries?.includes(shippingAddress.country) || countries?.includes('*');
      });
      if (matchingZone) {
        supabase.from('shipping_rates').select('*').eq('zone_id', matchingZone.id).then(({ data: rates }) => {
          if (rates?.length) {
            setShippingRates(rates);
            setSelectedShipping(rates[0].id);
            setShippingCost(rates[0].rate);
          } else {
            setShippingRates([{ id: 'free', name: 'Free Shipping', rate: 0, estimated_days: '5-7 business days' }]);
            setSelectedShipping('free');
          }
        });
      } else {
        setShippingRates([{ id: 'standard', name: 'Standard Shipping', rate: 9.99, estimated_days: '7-14 business days' }]);
        setSelectedShipping('standard');
        setShippingCost(9.99);
      }
    });
  }, [shippingAddress.country]);

  useEffect(() => {
    const rate = shippingRates.find(r => r.id === selectedShipping);
    if (rate) setShippingCost(rate.rate);
  }, [selectedShipping, shippingRates]);

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl mb-2">Your cart is empty</h1>
        <Button asChild><Link to="/collections">Continue Shopping</Link></Button>
      </div>
    );
  }

  const effectiveShippingCost = discountType === 'free_shipping' ? 0 : shippingCost;
  const orderTotal = total + effectiveShippingCost;
  const currentStepIndex = STEPS.indexOf(step);

  const validateInformation = () => {
    const { email, firstName, lastName, addressLine1, city, state, postalCode } = shippingAddress;
    if (!email || !firstName || !lastName || !addressLine1 || !city || !state || !postalCode) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 'information') {
      if (!validateInformation()) return;
      setStep('shipping');
    } else if (step === 'shipping') {
      if (!selectedShipping) { toast.error('Select a shipping method'); return; }
      
      if (paymentMethod === 'cod' || paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') {
        // Skip Stripe — go straight to payment step
        setStep('payment');
        return;
      }

      // Create payment intent when moving to payment step (Stripe only)
      setProcessing(true);
      setPaymentError(null);
      try {
        const addrJson = {
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          address_line_1: shippingAddress.addressLine1,
          address_line_2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
        };

        const resp = await fetch('/api/public/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: orderTotal,
            currency: settings.currency === 'PKR' ? 'pkr' : 'usd',
            email: shippingAddress.email,
            order_data: { shipping_address: addrJson },
            items: items.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data?.error) throw new Error(data?.error || 'Failed to initialize payment');

        setClientSecret(data.clientSecret);
        setStep('payment');
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to initialize payment');
        toast.error('Failed to initialize payment. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'shipping') setStep('information');
    else if (step === 'payment') setStep('shipping');
  };

  const useSavedAddress = (addr: any) => {
    setShippingAddress(prev => ({
      ...prev,
      firstName: addr.first_name,
      lastName: addr.last_name,
      addressLine1: addr.address_line_1,
      addressLine2: addr.address_line_2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
    }));
  };


  const handleSlipUpload = async (file: File) => {
    setUploadingSlip(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `slip-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('payment-slips').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('payment-slips').getPublicUrl(path);
      setMobilePaymentSlipUrl(urlData.publicUrl);
      setMobilePaymentSlip(file);
      toast.success('Payment slip uploaded!');
    } catch (err: any) {
      toast.error('Failed to upload slip: ' + err.message);
    }
    setUploadingSlip(false);
  };

  const handleMobilePaymentOrder = async () => {
    if (!mobilePaymentTid.trim() || mobilePaymentTid.trim() === 'TID-') { toast.error('Please enter the Transaction ID (TID)'); return; }
    if (!mobilePaymentSlipUrl) { toast.error('Please upload the payment receipt screenshot'); return; }
    setProcessing(true);
    try {
      const methodLabel = paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa';
      const addrJson = {
        first_name: shippingAddress.firstName, last_name: shippingAddress.lastName,
        address_line_1: shippingAddress.addressLine1, address_line_2: shippingAddress.addressLine2,
        city: shippingAddress.city, state: shippingAddress.state,
        postal_code: shippingAddress.postalCode, country: shippingAddress.country, phone: shippingAddress.phone,
      };
      const billingJson = billingSame ? addrJson : {
        first_name: billingAddress.firstName, last_name: billingAddress.lastName,
        address_line_1: billingAddress.addressLine1, address_line_2: billingAddress.addressLine2,
        city: billingAddress.city, state: billingAddress.state,
        postal_code: billingAddress.postalCode, country: billingAddress.country, phone: billingAddress.phone,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null, email: shippingAddress.email,
          subtotal, discount_amount: discountAmount, shipping_amount: effectiveShippingCost,
          tax_amount: 0, total: orderTotal,
          shipping_address_json: addrJson, billing_address_json: billingJson,
          status: 'pending' as any, payment_status: 'pending' as any,
          notes: [
            discountCode ? `Discount: ${discountCode}` : '',
            `Payment: ${methodLabel}`,
            `TID: ${mobilePaymentTid}`,
            mobilePaymentSlipUrl ? `Slip: ${mobilePaymentSlipUrl}` : '',
          ].filter(Boolean).join('. '),
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id, product_id: item.productId, variant_id: item.variantId,
        title: item.title, variant_title: item.variantTitle || null,
        quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity,
        image_url: item.image || null,
      }));
      await supabase.from('order_items').insert(orderItems);
      await supabase.from('order_timeline').insert({
        order_id: order.id, event: 'Order placed',
        description: `Order ${order.order_number} placed — ${methodLabel} payment, TID: ${mobilePaymentTid}`,
      });

      if (saveAddress && user) {
        await supabase.from('addresses').insert({
          user_id: user.id, first_name: shippingAddress.firstName, last_name: shippingAddress.lastName,
          address_line_1: shippingAddress.addressLine1, address_line_2: shippingAddress.addressLine2 || null,
          city: shippingAddress.city, state: shippingAddress.state, postal_code: shippingAddress.postalCode,
          country: shippingAddress.country, is_default: savedAddresses.length === 0,
        });
      }

      sendOrderConfirmationEmail(order.id);
      clearCart();
      setMobilePaymentSubmitted(true);

      const whatsappUrl = buildWhatsAppUrl(order.order_number, `${methodLabel} (TID: ${mobilePaymentTid})`);
      navigate(`/checkout/success?order=${order.order_number}${whatsappUrl ? `&whatsapp=${encodeURIComponent(whatsappUrl)}` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCODOrder = async () => {
    setProcessing(true);
    try {
      const addrJson = {
        first_name: shippingAddress.firstName, last_name: shippingAddress.lastName,
        address_line_1: shippingAddress.addressLine1, address_line_2: shippingAddress.addressLine2,
        city: shippingAddress.city, state: shippingAddress.state,
        postal_code: shippingAddress.postalCode, country: shippingAddress.country, phone: shippingAddress.phone,
      };
      const billingJson = billingSame ? addrJson : {
        first_name: billingAddress.firstName, last_name: billingAddress.lastName,
        address_line_1: billingAddress.addressLine1, address_line_2: billingAddress.addressLine2,
        city: billingAddress.city, state: billingAddress.state,
        postal_code: billingAddress.postalCode, country: billingAddress.country, phone: billingAddress.phone,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null, email: shippingAddress.email,
          subtotal, discount_amount: discountAmount, shipping_amount: effectiveShippingCost,
          tax_amount: 0, total: orderTotal,
          shipping_address_json: addrJson, billing_address_json: billingJson,
          status: 'pending' as any, payment_status: 'pending' as any,
          notes: [discountCode ? `Discount: ${discountCode}` : '', 'Payment: Cash on Delivery'].filter(Boolean).join('. '),
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id, product_id: item.productId, variant_id: item.variantId,
        title: item.title, variant_title: item.variantTitle || null,
        quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity,
        image_url: item.image || null,
      }));
      await supabase.from('order_items').insert(orderItems);
      await supabase.from('order_timeline').insert({
        order_id: order.id, event: 'Order placed', description: `Order ${order.order_number} placed — Cash on Delivery`,
      });

      if (saveAddress && user) {
        await supabase.from('addresses').insert({
          user_id: user.id, first_name: shippingAddress.firstName, last_name: shippingAddress.lastName,
          address_line_1: shippingAddress.addressLine1, address_line_2: shippingAddress.addressLine2 || null,
          city: shippingAddress.city, state: shippingAddress.state, postal_code: shippingAddress.postalCode,
          country: shippingAddress.country, is_default: savedAddresses.length === 0,
        });
      }

      sendOrderConfirmationEmail(order.id);
      clearCart();
      const whatsappUrl = buildWhatsAppUrl(order.order_number, 'Cash on Delivery');
      navigate(`/checkout/success?order=${order.order_number}&whatsapp=${encodeURIComponent(whatsappUrl)}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const addrJson = {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        address_line_1: shippingAddress.addressLine1,
        address_line_2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      };

      const billingJson = billingSame ? addrJson : {
        first_name: billingAddress.firstName,
        last_name: billingAddress.lastName,
        address_line_1: billingAddress.addressLine1,
        address_line_2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        postal_code: billingAddress.postalCode,
        country: billingAddress.country,
        phone: billingAddress.phone,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          email: shippingAddress.email,
          subtotal,
          discount_amount: discountAmount,
          shipping_amount: effectiveShippingCost,
          tax_amount: 0,
          total: orderTotal,
          shipping_address_json: addrJson,
          billing_address_json: billingJson,
          status: 'confirmed' as any,
          payment_status: 'paid' as any,
          stripe_payment_intent_id: paymentIntentId,
          notes: discountCode ? `Discount: ${discountCode}` : null,
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        variant_title: item.variantTitle || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        image_url: item.image || null,
      }));

      await supabase.from('order_items').insert(orderItems);
      await supabase.from('order_timeline').insert({
        order_id: order.id,
        event: 'Order placed',
        description: `Order ${order.order_number} placed with Stripe payment ${paymentIntentId}`,
      });

      if (saveAddress && user) {
        await supabase.from('addresses').insert({
          user_id: user.id,
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          address_line_1: shippingAddress.addressLine1,
          address_line_2: shippingAddress.addressLine2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
          is_default: savedAddresses.length === 0,
        });
      }

      sendOrderConfirmationEmail(order.id);

      clearCart();
      const whatsappUrl = buildWhatsAppUrl(order.order_number, 'Stripe (Paid)');
      navigate(`/checkout/success?order=${order.order_number}${whatsappUrl ? `&whatsapp=${encodeURIComponent(whatsappUrl)}` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
      setProcessing(false);
    }
  };

  return (
    <div className="container-page py-4 sm:py-8">
      {/* Breadcrumb steps */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-10 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[s];
          const isActive = i === currentStepIndex;
          const isCompleted = i < currentStepIndex;
          return (
            <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
              <button
                onClick={() => i < currentStepIndex && setStep(s)}
                disabled={i > currentStepIndex}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-accent/20 text-accent cursor-pointer' :
                  'text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                <span className="hidden xs:inline sm:inline">{STEP_LABELS[s]}</span>
                <span className="xs:hidden sm:hidden">{STEP_LABELS[s].slice(0, 3)}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile order summary toggle */}
      <div className="lg:hidden mb-4">
        <details className="bg-card rounded-lg border border-border">
          <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium">
            <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Order Summary ({items.length} items)</span>
            <span className="font-semibold">{formatPrice(orderTotal)}</span>
          </summary>
          <div className="p-3 pt-0 space-y-2 border-t border-border mt-1">
            {items.map(item => (
              <div key={item.variantId} className="flex gap-2 text-sm">
                <div className="relative w-10 h-10 rounded overflow-hidden bg-secondary shrink-0">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />}
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">{item.quantity}</span>
                </div>
                <p className="flex-1 truncate">{item.title}</p>
                <p className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="text-sm space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{effectiveShippingCost === 0 ? 'Free' : formatPrice(effectiveShippingCost)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(orderTotal)}</span></div>
            </div>
          </div>
        </details>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'information' && (
                <div className="space-y-6">
                  <h2 className="font-display text-xl">Contact & Shipping Address</h2>

                  {!user && (
                    <p className="text-sm text-muted-foreground">
                      Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
                    </p>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <Label>Saved Addresses</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {savedAddresses.map(a => (
                          <button key={a.id} onClick={() => useSavedAddress(a)}
                            className="text-left p-3 rounded-lg border border-border hover:border-accent transition-colors text-sm">
                            <p className="font-medium">{a.first_name} {a.last_name}</p>
                            <p className="text-muted-foreground">{a.address_line_1}, {a.city} {a.state}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AddressFields addr={shippingAddress} setAddr={setShippingAddress} showEmail />

                  {user && (
                    <div className="flex items-center gap-2">
                      <Checkbox id="saveAddr" checked={saveAddress} onCheckedChange={c => setSaveAddress(c === true)} />
                      <Label htmlFor="saveAddr" className="text-sm">Save this address for future orders</Label>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" asChild><Link to="/cart">← Return to cart</Link></Button>
                    <Button onClick={handleNext}>Continue to Shipping</Button>
                  </div>
                </div>
              )}

              {step === 'shipping' && (
                <div className="space-y-6">
                  <h2 className="font-display text-xl">Shipping Method</h2>
                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                    <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    <p className="text-muted-foreground">{shippingAddress.addressLine1}, {shippingAddress.city} {shippingAddress.state} {shippingAddress.postalCode}</p>
                  </div>

                  <div className="space-y-2">
                    {shippingRates.map(rate => (
                      <label key={rate.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedShipping === rate.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping" value={rate.id} checked={selectedShipping === rate.id}
                            onChange={() => setSelectedShipping(rate.id)} className="accent-[hsl(var(--accent))]" />
                          <div>
                            <p className="font-medium text-sm">{rate.name}</p>
                            {rate.estimated_days && <p className="text-xs text-muted-foreground">{rate.estimated_days}</p>}
                          </div>
                        </div>
                        <span className="font-semibold text-sm">{rate.rate === 0 ? 'Free' : formatPrice(Number(rate.rate))}</span>
                      </label>
                    ))}
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    {pm.stripe && (
                      <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="accent-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <span className="text-lg">💳</span> Credit / Debit Card
                            </p>
                            <p className="text-xs text-muted-foreground">Pay securely with Visa, Mastercard</p>
                          </div>
                        </div>
                      </label>
                    )}
                    {pm.cod && (
                      <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <img src="/media/0c8414fb-payment-cod.png" alt="COD" className="h-6 w-auto object-contain" /> Cash on Delivery
                            </p>
                            <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                          </div>
                        </div>
                      </label>
                    )}
                    {pm.jazzcash && (
                      <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'jazzcash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'jazzcash'} onChange={() => setPaymentMethod('jazzcash')} className="accent-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <img src="/media/87908764-payment-jazzcash.png" alt="JazzCash" className="h-6 w-auto object-contain" /> JazzCash
                            </p>
                            <p className="text-xs text-muted-foreground">Send payment via JazzCash mobile wallet</p>
                          </div>
                        </div>
                      </label>
                    )}
                    {pm.easypaisa && (
                      <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'easypaisa' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'easypaisa'} onChange={() => setPaymentMethod('easypaisa')} className="accent-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <img src="/media/e7e406c5-payment-easypaisa.png" alt="EasyPaisa" className="h-6 w-auto object-contain" /> EasyPaisa
                            </p>
                            <p className="text-xs text-muted-foreground">Send payment via EasyPaisa mobile wallet</p>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>

                  {paymentError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>{paymentError}</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={handleBack}>← Back</Button>
                    <Button onClick={handleNext} disabled={processing}>
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Initializing…
                        </span>
                      ) : 'Continue to Payment'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <h2 className="font-display text-xl">Payment</h2>

                  <div className="p-4 bg-secondary/50 rounded-lg text-sm space-y-1">
                    <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    <p className="text-muted-foreground">{shippingAddress.addressLine1}, {shippingAddress.city} {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p className="text-muted-foreground">{shippingRates.find(r => r.id === selectedShipping)?.name} — {effectiveShippingCost === 0 ? 'Free' : formatPrice(effectiveShippingCost)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="billingSame" checked={billingSame} onCheckedChange={c => setBillingSame(c === true)} />
                    <Label htmlFor="billingSame" className="text-sm">Billing address same as shipping</Label>
                  </div>

                  {!billingSame && (
                    <div>
                      <h3 className="font-medium text-sm mb-3">Billing Address</h3>
                      <AddressFields addr={billingAddress} setAddr={setBillingAddress} />
                    </div>
                  )}

                  {paymentMethod === 'cod' ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-sm">
                        <p className="font-medium mb-1 flex items-center gap-2"><img src="/media/0c8414fb-payment-cod.png" alt="COD" className="h-5 w-auto object-contain" /> Cash on Delivery</p>
                        <p className="text-muted-foreground">You will pay <strong>{formatPrice(orderTotal)}</strong> when your order is delivered. Please have the exact amount ready.</p>
                      </div>
                      <Button onClick={handleCODOrder} disabled={processing} className="w-full">
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Placing Order…
                          </span>
                        ) : `Place Order — ${formatPrice(orderTotal)}`}
                      </Button>
                    </div>
                  ) : (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') ? (
                    <div className="space-y-4">
                      {/* Account Details */}
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-sm space-y-2">
                        <p className="font-semibold flex items-center gap-2">
                          <img src={paymentMethod === 'jazzcash' ? '/media/87908764-payment-jazzcash.png' : '/media/e7e406c5-payment-easypaisa.png'} alt="" className="h-5 w-auto object-contain" />
                          {paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Payment Details
                        </p>
                        <p className="text-muted-foreground">Please send <strong>{formatPrice(orderTotal)}</strong> to:</p>
                        <div className="bg-background rounded-lg p-3 space-y-2 border border-border">
                          <div className="flex flex-col xs:flex-row xs:justify-between gap-0.5">
                            <span className="text-muted-foreground text-xs">Account Name</span>
                            <span className="font-medium break-all">{paymentMethod === 'jazzcash' ? pm.jazzcash_account_name : pm.easypaisa_account_name || '—'}</span>
                          </div>
                          <div className="flex flex-col xs:flex-row xs:justify-between gap-0.5">
                            <span className="text-muted-foreground text-xs">Account Number</span>
                            <span className="font-medium break-all">{paymentMethod === 'jazzcash' ? pm.jazzcash_account : pm.easypaisa_account || '—'}</span>
                          </div>
                          <div className="flex flex-col xs:flex-row xs:justify-between gap-0.5">
                            <span className="text-muted-foreground text-xs">Amount</span>
                            <span className="font-semibold text-foreground">{formatPrice(orderTotal)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">After sending payment, enter your Transaction ID below and upload a screenshot.</p>
                      </div>

                      {/* TID Input */}
                      <div>
                        <Label htmlFor="tid" className="text-sm font-medium">Transaction ID (TID) *</Label>
                        <Input id="tid" value={mobilePaymentTid} onChange={e => { const v = e.target.value; if (v.startsWith('TID-')) setMobilePaymentTid(v); }} placeholder="TID-XXXXXXXXXX" className="mt-1 font-mono" />
                      </div>

                      {/* Slip Upload */}
                      <div>
                        <Label className="text-sm font-medium">Payment Slip (Screenshot) *</Label>
                        <div className="mt-1">
                          {mobilePaymentSlip ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 min-w-0">
                              <Check className="h-4 w-4 text-green-600 shrink-0" />
                              <span className="text-sm flex-1 truncate max-w-[160px] sm:max-w-[250px]" title={mobilePaymentSlip.name}>{mobilePaymentSlip.name}</span>
                              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setMobilePaymentSlip(null); setMobilePaymentSlipUrl(''); }}>Remove</Button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                              <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleSlipUpload(e.target.files[0]); }} />
                              {uploadingSlip ? (
                                <><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Uploading…</span></>
                              ) : (
                                <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload payment screenshot</span></>
                              )}
                            </label>
                          )}
                        </div>
                      </div>

                      <Button onClick={handleMobilePaymentOrder} disabled={processing || !mobilePaymentTid.trim() || mobilePaymentTid.trim() === 'TID-' || !mobilePaymentSlipUrl} className="w-full">
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Placing Order…
                          </span>
                        ) : `Confirm Payment — ${formatPrice(orderTotal)}`}
                      </Button>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                      <StripePaymentForm
                        onSuccess={handlePaymentSuccess}
                        onError={(msg) => { setPaymentError(msg); toast.error(msg); }}
                        processing={processing}
                        setProcessing={setProcessing}
                        orderTotal={orderTotal}
                      />
                    </Elements>
                  ) : (
                    <div className="p-4 rounded-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      Loading payment form…
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>{paymentMethod === 'cod' ? 'Your order will be confirmed and you pay upon delivery.' :
                       (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') ? 'Your payment will be verified manually. You will receive confirmation once verified.' :
                       'Your payment is securely processed by Stripe. We never store your card details.'}</p>
                  </div>

                  <div className="pt-2">
                    <Button variant="ghost" onClick={handleBack}>← Back</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Order summary */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="bg-card rounded-lg border border-border p-5 sticky top-24 space-y-4">
            <h3 className="font-display text-lg">Order Summary</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.variantId} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-secondary shrink-0">
                    {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                    <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.variantTitle && <p className="text-xs text-muted-foreground">{item.variantTitle}</p>}
                  </div>
                  <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({discountCode})</span><span>-{formatPrice(discountAmount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{effectiveShippingCost === 0 ? 'Free' : formatPrice(effectiveShippingCost)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
                <span>Total</span><span>{formatPrice(orderTotal)}</span>
              </div>
            </div>
            {/* Payment logos */}
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              {pm.stripe && <span className="px-2 py-1 bg-secondary rounded text-[10px] font-semibold">💳 Visa/MC</span>}
              {pm.cod && <img src="/media/0c8414fb-payment-cod.png" alt="COD" className="h-8 w-auto object-contain" />}
              {pm.jazzcash && <img src="/media/87908764-payment-jazzcash.png" alt="JazzCash" className="h-8 w-auto object-contain" />}
              {pm.easypaisa && <img src="/media/e7e406c5-payment-easypaisa.png" alt="EasyPaisa" className="h-8 w-auto object-contain" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
