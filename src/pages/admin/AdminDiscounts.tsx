import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Discount {
  id: string;
  code: string;
  type: string;
  value: number;
  is_active: boolean | null;
  usage_limit: number | null;
  used_count: number | null;
  starts_at: string | null;
  ends_at: string | null;
  min_purchase_amount: number | null;
}

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    setDiscounts((data as Discount[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => {
    setCode(''); setType('percentage'); setValue(''); setIsActive(true);
    setUsageLimit(''); setMinPurchase(''); setStartsAt(''); setEndsAt(''); setEditingId(null);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id); setCode(d.code); setType(d.type); setValue(String(d.value));
    setIsActive(d.is_active !== false); setUsageLimit(d.usage_limit ? String(d.usage_limit) : '');
    setMinPurchase(d.min_purchase_amount ? String(d.min_purchase_amount) : '');
    setStartsAt(d.starts_at?.slice(0, 16) || ''); setEndsAt(d.ends_at?.slice(0, 16) || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !value) { toast.error('Code and value are required'); return; }
    setSaving(true);
    const payload = {
      code: code.toUpperCase(), type: type as any, value: parseFloat(value),
      is_active: isActive, usage_limit: usageLimit ? parseInt(usageLimit) : null,
      min_purchase_amount: minPurchase ? parseFloat(minPurchase) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from('discounts').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('discounts').insert(payload);
        if (error) throw error;
      }
      toast.success(editingId ? 'Updated' : 'Created');
      setDialogOpen(false); reset(); load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount?')) return;
    await supabase.from('discounts').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Discounts</h1>
        <Button onClick={() => { reset(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Discount</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No discounts yet.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>Used</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
            <TableBody>
              {discounts.map(d => (
                <TableRow key={d.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openEdit(d)}>
                  <TableCell className="font-mono font-medium text-sm">{d.code}</TableCell>
                  <TableCell className="text-sm">{d.type.replace('_', ' ')}</TableCell>
                  <TableCell className="text-sm">{d.type === 'percentage' ? `${d.value}%` : d.type === 'free_shipping' ? '—' : formatPrice(d.value)}</TableCell>
                  <TableCell><Badge variant={d.is_active ? 'default' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-sm">{d.used_count || 0}{d.usage_limit ? `/${d.usage_limit}` : ''}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openEdit(d); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(d.id); }} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) reset(); setDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} Discount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code *</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" className="font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value *</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percentage' ? '10' : '5.00'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Usage Limit</Label><Input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="Unlimited" /></div>
              <div><Label>Min. Purchase</Label><Input type="number" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} placeholder="None" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts At</Label><Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></div>
              <div><Label>Ends At</Label><Input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => { reset(); setDialogOpen(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiscounts;
