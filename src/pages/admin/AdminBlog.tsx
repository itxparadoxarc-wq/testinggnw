import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Upload, Eye } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string | null;
  status: string;
  category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const AdminBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query;
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const resetForm = () => {
    setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setStatus('draft');
    setCategory(''); setTags(''); setFeaturedImage(''); setEditingId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (p: BlogPost) => {
    setEditingId(p.id); setTitle(p.title); setSlug(p.slug);
    setExcerpt(p.excerpt || ''); setContent(p.content_html || '');
    setStatus(p.status); setCategory(p.category || '');
    setTags((p.tags || []).join(', ')); setFeaturedImage(p.featured_image_url || '');
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    setFeaturedImage(publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const finalSlug = slug || generateSlug(title);

    try {
      const postData = {
        title, slug: finalSlug, excerpt: excerpt || null,
        content_html: content || null, status: status as any,
        category: category || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        featured_image_url: featuredImage || null,
        author_id: user?.id || null,
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase.from('blog_posts').update(postData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert(postData);
        if (error) throw error;
      }

      toast.success(editingId ? 'Post updated' : 'Post created');
      setDialogOpen(false); resetForm(); loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    toast.success('Post deleted'); loadPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Blog Posts</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No blog posts found.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openEdit(p)}>
                  <TableCell>
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden">
                      {p.featured_image_url && <img src={p.featured_image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.excerpt}</p>}
                  </TableCell>
                  <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
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

      {/* Blog Post Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={e => { setTitle(e.target.value); if (!editingId) setSlug(generateSlug(e.target.value)); }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Content (HTML)</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="font-mono text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div>
                <Label>Tags</Label>
                <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2" />
              </div>
            </div>
            <div>
              <Label>Featured Image</Label>
              <div className="flex gap-2 items-end">
                {featuredImage && (
                  <div className="w-20 h-14 rounded overflow-hidden border border-border">
                    <img src={featuredImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button variant="outline" size="sm" asChild><span>{uploading ? 'Uploading…' : <><Upload className="h-3.5 w-3.5 mr-1" /> Upload</>}</span></Button>
                </label>
                {featuredImage && <Button variant="ghost" size="sm" onClick={() => setFeaturedImage('')}>Remove</Button>}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
