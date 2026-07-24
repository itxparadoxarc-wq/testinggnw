import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface ShippingZone {
  id: string;
  name: string;
  countries_json: string[];
  rates: ShippingRate[];
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  estimated_days: string | null;
  type: string;
}

const AdminShipping = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [countries, setCountries] = useState('');
  const [rates, setRates] = useState<{ name: string; rate: string; estimated_days: string }[]>([{ name: 'Standard', rate: '0', estimated_days: '5-7 days' }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: zonesData } = await supabase.from('shipping_zones').select('*').order('name');
    if (!zonesData) { setLoading(false); return; }
    const zonesWithRates = await Promise.all(zonesData.map(async (z: any) => {
      const { data: ratesData } = await supabase.from('shipping_rates').select('*').eq('zone_id', z.id);
      return { ...z, countries_json: z.countries_json as string[], rates: ratesData || [] };
    }));
    setZones(zonesWithRates);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setZoneName(''); setCountries(''); setRates([{ name: 'Standard', rate: '0', estimated_days: '5-7 days' }]); setEditingId(null); };

  const openEdit = (z: ShippingZone) => {
    setEditingId(z.id); setZoneName(z.name);
    setCountries((z.countries_json || []).join(', '));
    setRates(z.rates.length ? z.rates.map(r => ({ name: r.name, rate: String(r.rate), estimated_days: r.estimated_days || '' })) : [{ name: 'Standard', rate: '0', estimated_days: '5-7 days' }]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!zoneName.trim()) { toast.error('Zone name is required'); return; }
    setSaving(true);
    const countriesList = countries.split(',').map(c => c.trim()).filter(Boolean);
    try {
      let zoneId = editingId;
      if (editingId) {
        const { error } = await supabase.from('shipping_zones').update({ name: zoneName, countries_json: countriesList }).eq('id', editingId);
        if (error) throw error;
        await supabase.from('shipping_rates').delete().eq('zone_id', editingId);
      } else {
        const { data, error } = await supabase.from('shipping_zones').insert({ name: zoneName, countries_json: countriesList }).select('id').single();
        if (error) throw error;
        zoneId = data.id;
      }
      if (zoneId) {
        await supabase.from('shipping_rates').insert(
          rates.filter(r => r.name).map(r => ({
            zone_id: zoneId!, name: r.name, rate: parseFloat(r.rate) || 0,
            estimated_days: r.estimated_days || null,
          }))
        );
      }
      toast.success(editingId ? 'Updated' : 'Created');
      setDialogOpen(false); reset(); load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this zone and its rates?')) return;
    await supabase.from('shipping_rates').delete().eq('zone_id', id);
    await supabase.from('shipping_zones').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Shipping Zones</h1>
        <Button onClick={() => { reset(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Zone</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No shipping zones yet.</div>
      ) : (
        <div className="space-y-4">
          {zones.map(z => (
            <div key={z.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">{z.name}</h3>
                  <p className="text-xs text-muted-foreground">{z.countries_json.join(', ')}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(z)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(z.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {z.rates.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Rate</TableHead><TableHead>Est. Delivery</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {z.rates.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.name}</TableCell>
                        <TableCell className="text-sm">{r.rate === 0 ? 'Free' : formatPrice(r.rate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.estimated_days || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) reset(); setDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} Shipping Zone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Zone Name *</Label><Input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g. Domestic" /></div>
            <div><Label>Countries (comma separated codes)</Label><Input value={countries} onChange={e => setCountries(e.target.value)} placeholder="PK, US, GB, *" /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Rates</Label>
                <Button variant="outline" size="sm" onClick={() => setRates(prev => [...prev, { name: '', rate: '0', estimated_days: '' }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Rate
                </Button>
              </div>
              {rates.map((r, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <Input value={r.name} onChange={e => setRates(prev => prev.map((rr, ii) => ii === i ? { ...rr, name: e.target.value } : rr))} placeholder="Name" className="text-sm" />
                  <Input type="number" value={r.rate} onChange={e => setRates(prev => prev.map((rr, ii) => ii === i ? { ...rr, rate: e.target.value } : rr))} placeholder="Rate" className="text-sm" />
                  <Input value={r.estimated_days} onChange={e => setRates(prev => prev.map((rr, ii) => ii === i ? { ...rr, estimated_days: e.target.value } : rr))} placeholder="Est. days" className="text-sm" />
                </div>
              ))}
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

export default AdminShipping;
