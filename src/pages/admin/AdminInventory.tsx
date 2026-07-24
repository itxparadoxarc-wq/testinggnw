import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  title: string;
  sku: string | null;
  inventory_quantity: number;
  low_stock_threshold: number | null;
  product: { title: string } | null;
}

const AdminInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('product_variants')
        .select('id, title, sku, inventory_quantity, low_stock_threshold, product:products(title)')
        .order('inventory_quantity', { ascending: true });
      const mapped = (data || []).map((v: any) => ({
        ...v,
        product: Array.isArray(v.product) ? v.product[0] : v.product,
      }));
      setItems(mapped as InventoryItem[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.product?.title.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q);
  });

  const updateQty = async (id: string, qty: number) => {
    const { error } = await supabase.from('product_variants').update({ inventory_quantity: qty }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, inventory_quantity: qty } : i));
    toast.success('Inventory updated');
  };

  const stockStatus = (item: InventoryItem) => {
    if (item.inventory_quantity <= 0) return <Badge variant="destructive">Out of stock</Badge>;
    if (item.inventory_quantity <= (item.low_stock_threshold || 5)) return <Badge className="bg-warning text-warning-foreground">Low stock</Badge>;
    return <Badge variant="default">In stock</Badge>;
  };

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Inventory</h1>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search variants…" className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Variant</TableHead><TableHead>SKU</TableHead><TableHead>Status</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium text-sm">{i.product?.title || '—'}</TableCell>
                  <TableCell className="text-sm">{i.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{i.sku || '—'}</TableCell>
                  <TableCell>{stockStatus(i)}</TableCell>
                  <TableCell>
                    <Input type="number" value={i.inventory_quantity} className="w-20 h-8 text-sm"
                      onChange={e => updateQty(i.id, parseInt(e.target.value) || 0)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
