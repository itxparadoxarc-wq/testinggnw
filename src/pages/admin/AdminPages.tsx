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
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
}

const AdminPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
    setPages((data as Page[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const genSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const reset = () => { setTitle(''); setSlug(''); setContent(''); setStatus('draft'); setSeoTitle(''); setSeoDesc(''); setEditingId(null); };

  const openEdit = (p: Page) => {
    setEditingId(p.id); setTitle(p.title); setSlug(p.slug); setContent(p.content_html || '');
    setStatus(p.status); setSeoTitle(p.seo_title || ''); setSeoDesc(p.seo_description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title, slug: slug || genSlug(title), content_html: content || null,
      status: status as any, seo_title: seoTitle || null, seo_description: seoDesc || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) throw error;
      }
      toast.success(editingId ? 'Updated' : 'Created');
      setDialogOpen(false); reset(); load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await supabase.from('pages').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Pages</h1>
        <Button onClick={() => { reset(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Page</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No pages yet.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
            <TableBody>
              {pages.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openEdit(p)}>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.slug}</TableCell>
                  <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openEdit(p); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) reset(); setDialogOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={title} onChange={e => { setTitle(e.target.value); if (!editingId) setSlug(genSlug(e.target.value)); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} /></div>
            <div><Label>Content (HTML)</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="font-mono text-sm" /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
              </Select>
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

export default AdminPages;
