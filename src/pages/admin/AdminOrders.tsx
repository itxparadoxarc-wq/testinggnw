import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Eye, Truck, Clock, Package, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  order_number: string;
  email: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  total: number;
  created_at: string;
  shipping_address_json: any;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
}

interface OrderItem {
  id: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

interface TimelineEvent {
  id: string;
  event: string;
  description: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const paymentColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [note, setNote] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
    if (search) query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const openDetail = async (order: Order) => {
    setDetailOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setCarrier(order.carrier || '');
    setNote('');
    const [itemsRes, timelineRes] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', order.id),
      supabase.from('order_timeline').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
    ]);
    setOrderItems((itemsRes.data as OrderItem[]) || []);
    setTimeline((timelineRes.data as TimelineEvent[]) || []);
    setDialogOpen(true);
  };

  const updateOrderStatus = async (field: string, value: string) => {
    if (!detailOrder) return;
    const allowedFields = ['status', 'payment_status', 'fulfillment_status'] as const;
    if (!allowedFields.includes(field as (typeof allowedFields)[number])) {
      toast.error('This order field cannot be changed here');
      return;
    }
    const { error } = await supabase.from('orders').update({ [field]: value } as any).eq('id', detailOrder.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from('order_timeline').insert({
      order_id: detailOrder.id,
      event: `${field.replace(/_/g, ' ')} updated`,
      description: `Changed to ${value}`,
    });
    setDetailOrder({ ...detailOrder, [field]: value });
    toast.success('Status updated');
    loadOrders();
    const { data } = await supabase.from('order_timeline').select('*').eq('order_id', detailOrder.id).order('created_at', { ascending: false });
    setTimeline((data as TimelineEvent[]) || []);
  };

  const updateTracking = async () => {
    if (!detailOrder) return;
    const { error } = await supabase.from('orders').update({
      tracking_number: trackingNumber || null,
      carrier: carrier || null,
    }).eq('id', detailOrder.id);
    if (error) { toast.error(error.message); return; }
    if (trackingNumber) {
      await supabase.from('order_timeline').insert({
        order_id: detailOrder.id,
        event: 'Tracking added',
        description: `${carrier ? carrier + ': ' : ''}${trackingNumber}`,
      });
    }
    toast.success('Tracking updated');
  };

  const addNote = async () => {
    if (!detailOrder || !note.trim()) return;
    await supabase.from('order_timeline').insert({
      order_id: detailOrder.id,
      event: 'Note added',
      description: note,
    });
    setNote('');
    const { data } = await supabase.from('order_timeline').select('*').eq('order_id', detailOrder.id).order('created_at', { ascending: false });
    setTimeline((data as TimelineEvent[]) || []);
    toast.success('Note added');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order # or email…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openDetail(o)}>
                    <TableCell className="font-medium text-sm">{o.order_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{o.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[o.status] || 'bg-secondary'}`}>
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${paymentColors[o.payment_status] || 'bg-secondary'}`}>
                        {o.payment_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatPrice(Number(o.total))}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openDetail(o); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {detailOrder.order_number}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[detailOrder.status] || 'bg-secondary'}`}>
                    {detailOrder.status}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Items + Address */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Items</h3>
                    <div className="space-y-2">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex gap-2 text-sm p-2 rounded-lg bg-secondary/50">
                          <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                            {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            {item.variant_title && <p className="text-xs text-muted-foreground">{item.variant_title}</p>}
                            <p className="text-xs text-muted-foreground">×{item.quantity} @ {formatPrice(Number(item.unit_price))}</p>
                          </div>
                          <p className="font-medium text-sm">{formatPrice(Number(item.total_price))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detailOrder.shipping_address_json && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <h3 className="text-sm font-semibold flex items-center gap-1 mb-1"><MapPin className="h-3.5 w-3.5" /> Shipping</h3>
                      <div className="text-sm text-muted-foreground">
                        <p>{detailOrder.shipping_address_json.first_name} {detailOrder.shipping_address_json.last_name}</p>
                        <p>{detailOrder.shipping_address_json.address_line_1}</p>
                        <p>{detailOrder.shipping_address_json.city}, {detailOrder.shipping_address_json.state} {detailOrder.shipping_address_json.postal_code}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-sm space-y-1 pt-2 border-t border-border">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(Number(detailOrder.subtotal))}</span></div>
                    <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(Number(detailOrder.total))}</span></div>
                  </div>

                  {/* Payment Slip Preview */}
                  {(() => {
                    const slipMatch = detailOrder.notes?.match(/Slip:\s*(https?:\/\/\S+)/);
                    const slipUrl = slipMatch?.[1]?.replace(/\.$/, '');
                    if (!slipUrl) return null;
                    return (
                      <div className="p-3 rounded-lg bg-secondary/50 mt-3">
                        <h3 className="text-sm font-semibold mb-2">💳 Payment Slip</h3>
                        <img
                          src={slipUrl}
                          alt="Payment slip"
                          className="max-w-full max-h-48 rounded-lg border border-border object-contain cursor-pointer"
                          onClick={() => window.open(slipUrl, '_blank')}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Actions + Timeline */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Update Status</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Order Status</Label>
                        <Select value={detailOrder.status} onValueChange={v => updateOrderStatus('status', v)}>
                          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s =>
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Payment</Label>
                        <Select value={detailOrder.payment_status} onValueChange={v => updateOrderStatus('payment_status', v)}>
                          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['pending', 'paid', 'failed', 'refunded', 'partially_refunded'].map(s =>
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Fulfillment</Label>
                        <Select value={detailOrder.fulfillment_status} onValueChange={v => updateOrderStatus('fulfillment_status', v)}>
                          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['unfulfilled', 'partially_fulfilled', 'fulfilled', 'shipped', 'delivered', 'cancelled'].map(s =>
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Tracking</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="TCS, Leopards…" className="h-8 text-xs" />
                      <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking #" className="h-8 text-xs" />
                    </div>
                    <Button variant="outline" size="sm" onClick={updateTracking} className="text-xs">Save Tracking</Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Add Note</h3>
                    <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Internal note…" className="text-xs" />
                    <Button variant="outline" size="sm" onClick={addNote} disabled={!note.trim()} className="text-xs">Add Note</Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1 mb-2"><Clock className="h-3.5 w-3.5" /> Timeline</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {timeline.map((t, i) => (
                        <div key={t.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                            {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="pb-2">
                            <p className="text-xs font-medium">{t.event}</p>
                            {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                            <p className="text-[10px] text-muted-foreground/60">{new Date(t.created_at).toLocaleString('en-PK')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
