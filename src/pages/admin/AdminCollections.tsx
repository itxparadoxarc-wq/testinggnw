import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const AdminCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
    setCollections((data as Collection[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const genSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const reset = () => { setName(''); setSlug(''); setDescription(''); setImageUrl(''); setSeoTitle(''); setSeoDesc(''); setEditingId(null); };

  const openEdit = (c: Collection) => {
    setEditingId(c.id); setName(c.name); setSlug(c.slug); setDescription(c.description || '');
    setImageUrl(c.image_url || ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const payload = { name, slug: slug || genSlug(name), description: description || null, image_url: imageUrl || null, seo_title: seoTitle || null, seo_description: seoDesc || null };
    try {
      if (editingId) {
        const { error } = await supabase.from('collections').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('collections').insert(payload);
        if (error) throw error;
      }
      toast.success(editingId ? 'Updated' : 'Created');
      setDialogOpen(false); reset(); load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await supabase.from('collection_products').delete().eq('collection_id', id);
    await supabase.from('collections').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `collections/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    setImageUrl(publicUrl);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Collections</h1>
        <Button onClick={() => { reset(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Collection</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No collections yet.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead className="w-12"></TableHead><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
            <TableBody>
              {collections.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openEdit(c)}>
                  <TableCell><div className="w-10 h-10 rounded bg-secondary overflow-hidden">{c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}</div></TableCell>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(c.id); }} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} Collection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={name} onChange={e => { setName(e.target.value); if (!editingId) setSlug(genSlug(e.target.value)); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label>Image</Label>
              <div className="flex gap-2 items-center">
                {imageUrl && <div className="w-16 h-16 rounded border border-border overflow-hidden"><img src={imageUrl} alt="" className="w-full h-full object-cover" /></div>}
                <label className="cursor-pointer"><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /><Button variant="outline" size="sm" asChild><span><Upload className="h-3.5 w-3.5 mr-1" /> Upload</span></Button></label>
              </div>
            </div>
            <div><Label>SEO Title</Label><Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /></div>
            <div><Label>SEO Description</Label><Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2} /></div>
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

export default AdminCollections;
