import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Star, Eye } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  user_id: string;
  product_id: string;
  product?: { title: string };
  profile?: { full_name: string | null; email: string | null };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState<Review | null>(null);
  const [reply, setReply] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from('reviews')
        .select('*, product:products(title)')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      const { data } = await query;
      const mapped = (data || []).map((r: any) => ({
        ...r,
        product: Array.isArray(r.product) ? r.product[0] : r.product,
      }));
      setReviews(mapped as Review[]);
      setLoading(false);
    };
    load();
  }, [statusFilter]);

  const openDetail = (r: Review) => {
    setDetail(r); setReply(r.admin_reply || ''); setDialogOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reviews').update({ status: status as any }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : null);
    toast.success('Status updated');
  };

  const saveReply = async () => {
    if (!detail) return;
    await supabase.from('reviews').update({ admin_reply: reply || null }).eq('id', detail.id);
    setReviews(prev => prev.map(r => r.id === detail.id ? { ...r, admin_reply: reply || null } : r));
    toast.success('Reply saved');
  };

  const statusBadge = (s: string) => s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Reviews</h1>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-36 mb-4"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No reviews found.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {reviews.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openDetail(r)}>
                  <TableCell className="text-sm font-medium">{r.product?.title || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-accent text-accent' : 'text-border'}`} />)}</div>
                  </TableCell>
                  <TableCell><Badge variant={statusBadge(r.status) as any}>{r.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {detail && (
            <>
              <DialogHeader><DialogTitle>Review for {detail.product?.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < detail.rating ? 'fill-accent text-accent' : 'text-border'}`} />)}</div>
                {detail.title && <p className="font-medium text-sm">{detail.title}</p>}
                {detail.body && <p className="text-sm text-muted-foreground">{detail.body}</p>}
                <div className="flex gap-2">
                  <Select value={detail.status} onValueChange={v => updateStatus(detail.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Admin Reply</p>
                  <Textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} />
                  <Button size="sm" className="mt-2" onClick={saveReply}>Save Reply</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
