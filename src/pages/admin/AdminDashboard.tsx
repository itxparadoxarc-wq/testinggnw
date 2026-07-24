import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/currency';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('total'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, order_number, email, total, status, payment_status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('product_variants').select('id, title, inventory_quantity, low_stock_threshold, product:products(title)').lte('inventory_quantity', 10).order('inventory_quantity').limit(5),
    ]).then(([revRes, ordRes, custRes, prodRes, recentRes, lowRes]) => {
      setStats({
        revenue: (revRes.data || []).reduce((s, o) => s + Number(o.total), 0),
        orders: ordRes.count || 0,
        customers: custRes.count || 0,
        products: prodRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setLowStock((lowRes.data || []).map((v: any) => ({ ...v, product: Array.isArray(v.product) ? v.product[0] : v.product })));
    });
  }, []);

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: DollarSign, color: 'bg-green-500/10 text-green-600' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Products', value: stats.products, icon: Package, color: 'bg-orange-500/10 text-orange-600' },
  ];

  const statusColor = (s: string) => {
    const map: Record<string, string> = { paid: 'default', pending: 'secondary', delivered: 'default', shipped: 'outline', cancelled: 'destructive' };
    return (map[s] || 'secondary') as any;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Welcome back, {profile?.full_name || 'Admin'} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`p-2 rounded-lg ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <Link to="/admin/orders" key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium">{o.order_number || 'Order'}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPrice(Number(o.total))}</p>
                      <Badge variant={statusColor(o.payment_status)} className="text-[10px]">{o.payment_status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All stock levels are healthy</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map(v => (
                  <Link to="/admin/inventory" key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium">{v.product?.title || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{v.title}</p>
                    </div>
                    <Badge variant={v.inventory_quantity === 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {v.inventory_quantity} left
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Guide */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-display text-lg mb-2">🚀 Getting Started</h3>
          <p className="text-sm text-muted-foreground mb-4">Here's how to manage your GrabnWear store:</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Add Products', desc: 'Go to Products → Add Product. Upload images, set prices, add variants.', link: '/admin/products' },
              { label: 'Manage Orders', desc: 'View and process customer orders, update fulfillment status.', link: '/admin/orders' },
              { label: 'Categories', desc: 'Organize products into categories for easy browsing.', link: '/admin/categories' },
              { label: 'Discounts', desc: 'Create promo codes like WELCOME10 for customer discounts.', link: '/admin/discounts' },
              { label: 'Blog Posts', desc: 'Publish articles to engage customers and boost SEO.', link: '/admin/blog' },
              { label: 'Store Settings', desc: 'Update store name, announcement bar, and social links.', link: '/admin/settings' },
            ].map(item => (
              <Link key={item.label} to={item.link} className="block p-3 rounded-lg bg-background border border-border hover:shadow-sm hover:border-primary/30 transition-all">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
