import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Star, Edit2 } from 'lucide-react';

interface AddressRow {
  id: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean | null;
  type: string | null;
}

const empty = { first_name: '', last_name: '', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'PK' };

const AddressesPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    setAddresses((data as AddressRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { first_name, last_name, address_line_1, city, state, postal_code, country } = form;
    if (!first_name.trim() || !last_name.trim() || !address_line_1.trim() || !city.trim() || !state.trim() || !postal_code.trim()) {
      toast.error('Please fill all required fields'); return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      address_line_1: address_line_1.trim(),
      address_line_2: form.address_line_2?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postal_code: postal_code.trim(),
      country,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('addresses').update(payload).eq('id', editId));
      if (!error) toast.success('Address updated');
    } else {
      ({ error } = await supabase.from('addresses').insert({ ...payload, is_default: addresses.length === 0 }));
      if (!error) toast.success('Address added');
    }

    if (error) {
      toast.error('Failed to save address');
      setSaving(false);
      return;
    }

    setForm(empty);
    setEditId(null);
    setOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast.success('Address removed');
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    toast.success('Default address set');
    load();
  };

  const openEdit = (a: AddressRow) => {
    setForm({
      first_name: a.first_name, last_name: a.last_name,
      address_line_1: a.address_line_1, address_line_2: a.address_line_2 || '',
      city: a.city, state: a.state, postal_code: a.postal_code, country: a.country,
    });
    setEditId(a.id);
    setOpen(true);
  };

  const pakistanProvinces = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'Azad Kashmir'];

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">My Addresses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your delivery addresses</p>
        </div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setForm(empty); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Address</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add New'} Address</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Muhammad" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Ali" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Street Address *</Label>
                <Input value={form.address_line_1} onChange={e => setForm({ ...form, address_line_1: e.target.value })} placeholder="House #, Street, Area" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Apartment, Suite (Optional)</Label>
                <Input value={form.address_line_2 || ''} onChange={e => setForm({ ...form, address_line_2: e.target.value })} placeholder="Floor, Block, etc." className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City *</Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Lahore" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Province *</Label>
                  <Select value={form.state} onValueChange={v => setForm({ ...form, state: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select province" /></SelectTrigger>
                    <SelectContent>
                      {pakistanProvinces.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Postal Code *</Label>
                  <Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} placeholder="54000" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Country</Label>
                  <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PK">Pakistan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Address'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-36 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-lg mb-1">No Addresses Yet</h3>
          <p className="text-muted-foreground text-sm">Add a delivery address to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map(a => (
            <div key={a.id} className={`relative p-5 bg-card rounded-xl border transition-colors ${a.is_default ? 'border-primary/40 shadow-sm' : 'border-border'}`}>
              {a.is_default && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-primary" /> Default
                </span>
              )}
              <p className="font-semibold text-sm">{a.first_name} {a.last_name}</p>
              <p className="text-sm text-muted-foreground mt-1">{a.address_line_1}</p>
              {a.address_line_2 && <p className="text-sm text-muted-foreground">{a.address_line_2}</p>}
              <p className="text-sm text-muted-foreground">{a.city}, {a.state} {a.postal_code}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.country === 'PK' ? 'Pakistan' : a.country}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(a)} className="gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
                </Button>
                {!a.is_default && <Button variant="outline" size="sm" onClick={() => setDefault(a.id)}>Set Default</Button>}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive ml-auto">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
