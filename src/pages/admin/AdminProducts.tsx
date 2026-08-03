import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Upload, X, Package, Sparkles, Loader2, Send } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import ReactMarkdown from 'react-markdown';

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  vendor: string | null;
  product_type: string | null;
  created_at: string;
  category_id: string | null;
  description_html: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  product_images: { id: string; url: string; is_featured: boolean | null; position: number | null }[];
  product_variants: { id: string; title: string; price: number; compare_at_price: number | null; inventory_quantity: number; sku: string | null; is_active: boolean | null }[];
}

interface VariantForm {
  id?: string;
  title: string;
  price: string;
  compare_at_price: string;
  sku: string;
  inventory_quantity: string;
  is_active: boolean;
}

const emptyVariant: VariantForm = { title: 'Default', price: '0', compare_at_price: '', sku: '', inventory_quantity: '0', is_active: true };

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [vendor, setVendor] = useState('');
  const [productType, setProductType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [variants, setVariants] = useState<VariantForm[]>([{ ...emptyVariant }]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, product_images(id, url, is_featured, position), product_variants(id, title, price, compare_at_price, inventory_quantity, sku, is_active)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query;
    setProducts((data as unknown as Product[]) || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const resetForm = () => {
    setTitle(''); setSlug(''); setDescription(''); setStatus('draft'); setVendor('');
    setProductType(''); setCategoryId(''); setTags(''); setSeoTitle(''); setSeoDescription('');
    setVariants([{ ...emptyVariant }]); setImageUrls([]); setEditingId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = async (p: Product) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setDescription(p.description_html || '');
    setStatus(p.status);
    setVendor(p.vendor || '');
    setProductType(p.product_type || '');
    setCategoryId(p.category_id || '');
    setTags((p.tags || []).join(', '));
    setSeoTitle(p.seo_title || '');
    setSeoDescription(p.seo_description || '');
    setImageUrls(p.product_images.sort((a, b) => (a.position || 0) - (b.position || 0)).map(i => i.url));
    setVariants(p.product_variants.length ? p.product_variants.map(v => ({
      id: v.id, title: v.title, price: String(v.price),
      compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '',
      sku: v.sku || '', inventory_quantity: String(v.inventory_quantity), is_active: v.is_active !== false,
    })) : [{ ...emptyVariant }]);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      newUrls.push(publicUrl);
    }
    setImageUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
    // Reset input
    e.target.value = '';
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const addVariant = () => setVariants(prev => [...prev, { ...emptyVariant, title: `Variant ${prev.length + 1}` }]);
  const removeVariant = (idx: number) => setVariants(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const updateVariant = (idx: number, field: keyof VariantForm, value: string | boolean) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!variants.some(v => v.price && parseFloat(v.price) >= 0)) { toast.error('At least one variant needs a price'); return; }
    const finalSlug = slug || generateSlug(title);
    setSaving(true);

    try {
      const productData = {
        title, slug: finalSlug, description_html: description || null,
        status: status as any, vendor: vendor || null, product_type: productType || null,
        category_id: categoryId || null, tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        seo_title: seoTitle || null, seo_description: seoDescription || null,
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle images
      if (editingId) {
        await supabase.from('product_images').delete().eq('product_id', editingId);
      }
      if (imageUrls.length && productId) {
        await supabase.from('product_images').insert(
          imageUrls.map((url, i) => ({ product_id: productId!, url, position: i, is_featured: i === 0 }))
        );
      }

      // Handle variants
      if (editingId) {
        await supabase.from('product_variants').delete().eq('product_id', editingId);
      }
      if (productId) {
        await supabase.from('product_variants').insert(
          variants.map(v => ({
            product_id: productId!,
            title: v.title || 'Default',
            price: parseFloat(v.price) || 0,
            compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
            sku: v.sku || null,
            inventory_quantity: parseInt(v.inventory_quantity) || 0,
            is_active: v.is_active,
          }))
        );
      }

      toast.success(editingId ? 'Product updated!' : 'Product created!');
      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('product_images').delete().eq('product_id', id);
    await supabase.from('product_variants').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
    toast.success('Product deleted');
    loadProducts();
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'default';
    if (s === 'draft') return 'secondary';
    return 'outline';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="font-display text-2xl">Products</h1>
        <Button onClick={openNew} className="shrink-0"><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No products found.</p>
          <Button onClick={openNew} variant="outline" className="mt-3"><Plus className="h-4 w-4 mr-1" /> Add your first product</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Inventory</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => {
                const featuredImg = p.product_images.find(i => i.is_featured)?.url || p.product_images[0]?.url;
                const price = p.product_variants[0]?.price;
                const totalInv = p.product_variants.reduce((s, v) => s + v.inventory_quantity, 0);
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => openEdit(p)}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden">
                        {featuredImg ? <img src={featuredImg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/5" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{p.title}</p>
                      {p.vendor && <p className="text-xs text-muted-foreground">{p.vendor}</p>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant={statusColor(p.status) as any}>{p.status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{totalInv} in stock</TableCell>
                    <TableCell className="text-sm font-medium">{price !== undefined ? formatPrice(Number(price)) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openEdit(p); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>

          {/* AI Product Assistant */}
          <ProductAIBar
            onApply={(fields) => {
              if (fields.title) setTitle(fields.title);
              if (fields.slug) setSlug(fields.slug);
              if (fields.description) setDescription(fields.description);
              if (fields.vendor) setVendor(fields.vendor);
              if (fields.productType) setProductType(fields.productType);
              if (fields.tags) setTags(fields.tags);
              if (fields.seoTitle) setSeoTitle(fields.seoTitle);
              if (fields.seoDescription) setSeoDescription(fields.seoDescription);
              if (fields.variants) {
                setVariants(fields.variants.map((v: any) => ({
                  title: v.title || 'Default',
                  price: String(v.price || 0),
                  compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '',
                  sku: v.sku || '',
                  inventory_quantity: String(v.inventory_quantity || 0),
                  is_active: true,
                })));
              }
              toast.success('AI suggestions applied!');
            }}
            currentProduct={{ title, description, vendor, productType, tags, variants }}
          />

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={e => { setTitle(e.target.value); if (!editingId) setSlug(generateSlug(e.target.value)); }} placeholder="Product title" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
              </div>
              <div>
                <Label>Description (HTML)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Brand name" />
                </div>
                <div>
                  <Label>Product Type</Label>
                  <Input value={productType} onChange={e => setProductType(e.target.value)} placeholder="e.g. T-Shirt" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={categoryId || 'none'} onValueChange={v => setCategoryId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2" />
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <Label className="mb-2 block">Images</Label>
              <div className="flex gap-2 flex-wrap">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center">Featured</span>}
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  {uploading ? <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                </label>
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Variants & Pricing</Label>
                <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-3 w-3 mr-1" /> Add Variant</Button>
              </div>
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Variant {i + 1}</p>
                      {variants.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeVariant(i)} className="text-destructive hover:text-destructive h-6 w-6 p-0">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div><Label className="text-xs">Title</Label><Input value={v.title} onChange={e => updateVariant(i, 'title', e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Price (PKR)</Label><Input type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Compare Price</Label><Input type="number" value={v.compare_at_price} onChange={e => updateVariant(i, 'compare_at_price', e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">SKU</Label><Input value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Inventory</Label><Input type="number" value={v.inventory_quantity} onChange={e => updateVariant(i, 'inventory_quantity', e.target.value)} className="h-8 text-sm" /></div>
                      <div className="flex items-end gap-2 pb-1">
                        <Switch checked={v.is_active} onCheckedChange={c => updateVariant(i, 'is_active', c)} />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">SEO</Label>
              <div><Label className="text-xs">SEO Title</Label><Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /></div>
              <div><Label className="text-xs">SEO Description</Label><Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} /></div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// AI Product Assistant Bar
const AI_CHAT_URL = '/api/public/ai-chat';

const PRODUCT_AI_PROMPTS = [
  'Generate title, description & SEO for this product',
  'Generate a catchy product description',
  'Suggest SKUs for my variants',
  'Write SEO title & description',
  'Suggest pricing strategy for Pakistan market',
];

interface ProductAIBarProps {
  onApply: (fields: any) => void;
  currentProduct: { title: string; description: string; vendor: string; productType: string; tags: string; variants: VariantForm[] };
}

const ProductAIBar = ({ onApply, currentProduct }: ProductAIBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [parsedFields, setParsedFields] = useState<any>(null);

  const askAI = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse('');
    setParsedFields(null);

    const context = `Current product info:
- Title: ${currentProduct.title || '(empty)'}
- Description: ${currentProduct.description || '(empty)'}
- Vendor: ${currentProduct.vendor || '(empty)'}
- Type: ${currentProduct.productType || '(empty)'}
- Tags: ${currentProduct.tags || '(empty)'}
- Variants: ${currentProduct.variants.map(v => `${v.title} - Rs.${v.price} - SKU:${v.sku || 'none'}`).join(', ')}`;

    const systemPrompt = `You are a product data assistant for GrabnWear (Pakistani fashion e-commerce).
The admin is adding/editing a product and needs your help.

${context}

IMPORTANT: After your helpful text response, if you are generating/suggesting product field values, include a JSON block at the very end wrapped in \`\`\`json ... \`\`\` with any of these fields you want to suggest:
{
  "title": "...",
  "slug": "...",
  "description": "<p>HTML description</p>",
  "vendor": "...",
  "productType": "...",
  "tags": "tag1, tag2, tag3",
  "seoTitle": "...",
  "seoDescription": "...",
  "variants": [{ "title": "Default", "price": 2500, "compare_at_price": 3000, "sku": "GW-XXX", "inventory_quantity": 50 }]
}
Only include fields you are suggesting changes for. Use PKR prices.`;

    try {
      const resp = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!resp.ok || !resp.body) {
        toast.error('AI service error');
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setResponse(full);
            }
          } catch { /* partial */ }
        }
      }

      // Parse JSON block from response
      const jsonMatch = full.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const fields = JSON.parse(jsonMatch[1]);
          setParsedFields(fields);
        } catch { /* no valid JSON */ }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect to AI');
    }
    setLoading(false);
  };

  const displayText = response.replace(/```json[\s\S]*?```/g, '').trim();

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI Product Assistant</span>
        <span className="text-xs text-muted-foreground ml-1">— ask AI to fill fields, write descriptions, suggest SKUs</span>
        <span className="ml-auto text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3 animate-fade-in">
          {/* Quick prompts */}
          <div className="flex gap-1.5 flex-wrap">
            {PRODUCT_AI_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setInput(p); askAI(p); }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 'Generate SKU GW-HD-001 for a black hoodie priced at Rs.3500'"
              className="text-sm"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); askAI(input); } }}
            />
            <Button size="sm" onClick={() => askAI(input)} disabled={!input.trim() || loading} className="shrink-0 gap-1.5">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Ask
            </Button>
          </div>

          {/* Response */}
          {(response || loading) && (
            <div className="rounded-lg bg-background border border-border p-3 max-h-48 overflow-y-auto">
              {loading && !response && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                </div>
              )}
              {displayText && (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-sm [&>p]:mb-1 [&>ul]:mb-1">
                  <ReactMarkdown>{displayText}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Apply button */}
          {parsedFields && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onApply(parsedFields)} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Apply AI Suggestions
              </Button>
              <span className="text-xs text-muted-foreground">
                Will update: {Object.keys(parsedFields).filter(k => k !== 'variants').join(', ')}
                {parsedFields.variants ? ', variants' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
