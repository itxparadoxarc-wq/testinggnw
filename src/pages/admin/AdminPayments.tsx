import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Eye, Clock, CreditCard, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface PaymentOrder {
  id: string;
  order_number: string;
  email: string;
  status: string;
  payment_status: string;
  total: number;
  notes: string | null;
  created_at: string;
  shipping_address_json: any;
}

const extractPaymentInfo = (notes: string | null) => {
  if (!notes) return { method: null, tid: null, slipUrl: null };
  const methodMatch = notes.match(/Payment:\s*(JazzCash|EasyPaisa)/i);
  const tidMatch = notes.match(/TID:\s*(\S+)/);
  const slipMatch = notes.match(/Slip:\s*(https?:\/\/\S+)/);
  return {
    method: methodMatch?.[1] || null,
    tid: tidMatch?.[1]?.replace(/\.$/, '') || null,
    slipUrl: slipMatch?.[1]?.replace(/\.$/, '') || null,
  };
};

const AdminPayments = () => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .or('notes.ilike.%JazzCash%,notes.ilike.%EasyPaisa%')
      .order('created_at', { ascending: false });

    if (filter === 'pending') query = query.eq('payment_status', 'pending');
    else if (filter === 'paid') query = query.eq('payment_status', 'paid');

    if (search) query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);

    const { data } = await query;
    setOrders((data as PaymentOrder[]) || []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const openDetail = async (order: PaymentOrder) => {
    setSelectedOrder(order);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setOrderItems(data || []);
    setDialogOpen(true);
  };

  const updatePaymentStatus = async (orderId: string, status: 'paid' | 'failed') => {
    const { error } = await supabase.from('orders').update({
      payment_status: status,
      status: status === 'paid' ? 'confirmed' : 'cancelled',
    }).eq('id', orderId);

    if (error) { toast.error(error.message); return; }

    await supabase.from('order_timeline').insert({
      order_id: orderId,
      event: status === 'paid' ? 'Payment verified' : 'Payment rejected',
      description: status === 'paid'
        ? 'Mobile payment has been verified and approved by admin'
        : 'Mobile payment was rejected by admin',
    });

    toast.success(status === 'paid' ? 'Payment approved! Order confirmed.' : 'Payment rejected. Order cancelled.');

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, payment_status: status, status: status === 'paid' ? 'confirmed' : 'cancelled' });
    }
    loadOrders();
  };

  const pendingCount = orders.filter(o => o.payment_status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Payment Verification</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review JazzCash & EasyPaisa payments
            {pendingCount > 0 && <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingCount} pending</Badge>}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order # or email…" className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {(['pending', 'paid', 'all'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
              {f === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
              {f === 'paid' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} mobile payments found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden sm:table-cell">TID</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => {
                  const info = extractPaymentInfo(o.notes);
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{o.order_number}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${info.method === 'JazzCash' ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'}`}>
                          {info.method || 'Mobile'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{info.tid || '—'}</code>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{o.email}</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(Number(o.total))}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize ${
                          o.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          o.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {o.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(o)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {o.payment_status === 'pending' && (
                            <>
                              <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => updatePaymentStatus(o.id, 'paid')}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => updatePaymentStatus(o.id, 'failed')}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (() => {
            const info = extractPaymentInfo(selectedOrder.notes);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedOrder.order_number}
                    <Badge className={`text-xs capitalize ${
                      selectedOrder.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                {/* Payment Info */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" /> Payment Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Method</p>
                        <p className="font-medium">{info.method || 'Mobile Payment'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Transaction ID</p>
                        <p className="font-mono font-medium">{info.tid || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-semibold text-lg">{formatPrice(Number(selectedOrder.total))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Date</p>
                        <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('en-PK')}</p>
                      </div>
                    </div>
                    {info.slipUrl && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-2">Payment Slip</p>
                        <img
                          src={info.slipUrl}
                          alt="Payment slip"
                          className="max-w-full max-h-64 rounded-lg border border-border object-contain cursor-pointer"
                          onClick={() => window.open(info.slipUrl!, '_blank')}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = document.createElement('a');
                            fallback.href = info.slipUrl!;
                            fallback.target = '_blank';
                            fallback.className = 'inline-flex items-center gap-1.5 text-sm text-primary hover:underline';
                            fallback.innerHTML = '🔗 Open Payment Slip';
                            target.parentNode?.appendChild(fallback);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {orderItems.map((item: any) => (
                        <div key={item.id} className="flex gap-2 text-sm">
                          <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                            {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-xs">{item.title}</p>
                            {item.variant_title && <p className="text-[11px] text-muted-foreground">{item.variant_title}</p>}
                          </div>
                          <p className="text-xs font-medium">×{item.quantity} = {formatPrice(Number(item.total_price))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold mb-1">Customer</h3>
                    <p className="text-sm">{selectedOrder.email}</p>
                    {selectedOrder.shipping_address_json && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedOrder.shipping_address_json.first_name} {selectedOrder.shipping_address_json.last_name},
                        {' '}{selectedOrder.shipping_address_json.city}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedOrder.payment_status === 'pending' && (
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve Payment
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => updatePaymentStatus(selectedOrder.id, 'failed')}>
                        <XCircle className="h-4 w-4 mr-2" /> Reject Payment
                      </Button>
                    </div>
                  )}
                  {selectedOrder.payment_status === 'paid' && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-green-800">Payment Verified</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
