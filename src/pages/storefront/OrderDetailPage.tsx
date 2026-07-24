import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase.from('order_timeline').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    ]).then(([orderRes, itemsRes, timelineRes]) => {
      setOrder(orderRes.data);
      setItems(itemsRes.data || []);
      setTimeline(timelineRes.data || []);
      setLoading(false);
    });
  }, [id, user]);

  if (loading) return (
    <div className="container-page py-8">
      <div className="h-8 w-32 bg-secondary rounded animate-pulse mb-6" />
      <div className="h-48 bg-secondary rounded-xl animate-pulse" />
    </div>
  );
  if (!order) return (
    <div className="container-page py-16 text-center">
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Order not found.</p>
      <Link to="/account/orders" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to Orders</Link>
    </div>
  );

  const currentStepIndex = statusSteps.indexOf(order.status);
  const shippingAddr = order.shipping_address_json;

  return (
    <div className="container-page py-8">
      <Link to="/account/orders" className="text-sm text-primary hover:underline mb-6 inline-flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
      </Link>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-xl sm:text-2xl">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">{order.status}</Badge>
          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="capitalize">{order.payment_status}</Badge>
        </div>
      </div>

      {/* Progress Tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">Order Progress</h3>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-8 sm:mx-12" />
            <div className="absolute top-5 left-0 h-0.5 bg-primary mx-8 sm:mx-12" style={{ width: `${Math.max(0, currentStepIndex) / (statusSteps.length - 1) * 100}%` }} />
            {statusSteps.map((step, i) => {
              const Icon = statusIcons[step] || Clock;
              const isActive = i <= currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-2 capitalize font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold mb-2">Items ({items.length})</h3>
          {items.map(item => (
            <div key={item.id} className="flex gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.variant_title && <p className="text-xs text-muted-foreground">{item.variant_title}</p>}
                <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity} × {formatPrice(Number(item.unit_price))}</p>
              </div>
              <p className="text-sm font-bold shrink-0">{formatPrice(Number(item.total_price))}</p>
            </div>
          ))}

          {/* Shipping Address */}
          {shippingAddr && (
            <div className="bg-card rounded-xl border border-border p-4 mt-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <MapPin className="h-3.5 w-3.5" /> Delivery Address
              </h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{shippingAddr.first_name} {shippingAddr.last_name}</p>
                <p>{shippingAddr.address_line_1}</p>
                {shippingAddr.address_line_2 && <p>{shippingAddr.address_line_2}</p>}
                <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 mt-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <Clock className="h-3.5 w-3.5" /> Order Timeline
              </h3>
              <div className="space-y-3">
                {timeline.map((t, i) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-medium">{t.event}</p>
                      {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(t.created_at).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-5 h-fit space-y-3 text-sm">
          <h3 className="font-semibold">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
            {Number(order.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(Number(order.discount_amount))}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{Number(order.shipping_amount) > 0 ? formatPrice(Number(order.shipping_amount)) : 'Free'}</span></div>
            {Number(order.tax_amount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(Number(order.tax_amount))}</span></div>}
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-3 text-base">
            <span>Total</span><span>{formatPrice(Number(order.total))}</span>
          </div>
          {order.tracking_number && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium">Tracking</p>
              <p className="text-sm text-primary font-mono">{order.carrier ? `${order.carrier}: ` : ''}{order.tracking_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
