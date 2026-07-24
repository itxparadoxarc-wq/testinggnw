import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage your orders</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <ShoppingBag className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-xl mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Start shopping to see your orders here.</p>
          <Link to="/collections" className="text-primary text-sm font-medium hover:underline">
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} to={`/account/orders/${order.id}`}
              className="flex items-center gap-4 p-4 sm:p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 hidden sm:flex">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[order.status] || 'bg-secondary text-foreground border-border'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {order.payment_status === 'pending' && ' · Payment pending (COD)'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatPrice(Number(order.total))}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
