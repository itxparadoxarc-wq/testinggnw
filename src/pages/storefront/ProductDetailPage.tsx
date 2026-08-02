import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Minus, Plus, ShoppingBag, Share2, Star, ChevronRight, Facebook, Twitter, Link2, ZoomIn } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { motion } from 'framer-motion';
import ProductCard from '@/components/storefront/ProductCard';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { playPop } from '@/lib/sounds';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addItem, setIsOpen } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setSelectedImage(0);
      setQuantity(1);

      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_variants(id, title, sku, price, compare_at_price, inventory_quantity, is_active, low_stock_threshold), product_options(*), categories(name, slug)')
        .eq('slug', slug || '')
        .eq('status', 'active')
        .maybeSingle();

      if (error) console.error('Failed to load product', error);
      if (data) {
        const p = {
          ...data,
          images: (data.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
          variants: (data.product_variants || []).filter((v: any) => v.is_active),
          options: data.product_options || [],
          category: data.categories,
        };
        setProduct(p);
        if (p.variants.length > 0) setSelectedVariant(p.variants[0]);

        // Fetch reviews
        supabase.from('reviews').select('id, rating, title, body, created_at, user_id, admin_reply').eq('product_id', data.id).eq('status', 'approved').order('created_at', { ascending: false })
          .then(({ data: r }) => setReviews(r || []));

        // Fetch related products (same category)
        if (data.category_id) {
          supabase.from('products').select('id, title, slug, tags, product_images(id, url, alt_text, position), product_variants(id, title, price, compare_at_price, inventory_quantity, is_active)')
            .eq('status', 'active').eq('category_id', data.category_id).neq('id', data.id).limit(4)
            .then(({ data: rel }) => {
              setRelatedProducts((rel || []).map(p => ({ ...p, images: p.product_images || [], variants: p.product_variants || [] })));
            });
        }
      }
      setLoading(false);
    };
    if (slug) fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container-page py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-lg">Product not found.</p>
        <Link to="/collections" className="text-accent hover:underline mt-4 inline-block">Browse products</Link>
      </div>
    );
  }

  const v = selectedVariant;
  const inStock = v ? v.inventory_quantity > 0 : false;
  const isOnSale = v?.compare_at_price && v.compare_at_price > v.price;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleAddToCart = () => {
    if (!v || !inStock) return;
    addItem({
      productId: product.id,
      variantId: v.id,
      title: product.title,
      variantTitle: v.title,
      price: v.price,
      quantity,
      image: product.images[0]?.url || '',
      maxQuantity: v.inventory_quantity,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsOpen(true);
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
    else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${product.title}`);
    else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1 flex-wrap">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/collections" className="hover:text-foreground">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/collections?category=${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-secondary relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
            {product.images[selectedImage] && (
              <img src={product.images[selectedImage].url} alt={product.images[selectedImage].alt_text || product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <div className="absolute top-3 right-3 p-2 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-4 w-4" />
            </div>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {isOnSale && <Badge className="bg-sale text-sale-foreground">-{Math.round((1 - v.price / v.compare_at_price) * 100)}%</Badge>}
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: any, i: number) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === selectedImage ? 'border-accent' : 'border-transparent hover:border-border'
                  }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-3xl p-2">
              {product.images[selectedImage] && (
                <img src={product.images[selectedImage].url} alt={product.title} className="w-full h-auto rounded-lg" />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Product Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {product.vendor && <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.vendor}</p>}
          <h1 className="font-display text-2xl lg:text-3xl">{product.title}</h1>

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-accent text-accent' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}

          {/* Price */}
          {v && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">{formatPrice(v.price)}</span>
              {isOnSale && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(v.compare_at_price)}</span>
                  <Badge className="bg-sale text-sale-foreground">Save {formatPrice(v.compare_at_price - v.price)}</Badge>
                </>
              )}
            </div>
          )}

          {/* Short description */}
          {product.description_html && (
            <div className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{
              __html: product.description_html.replace(/<[^>]*>/g, ' ').slice(0, 200)
            }} />
          )}

          {/* Variant selector */}
          {product.variants.length > 1 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Variant: <span className="text-muted-foreground">{selectedVariant?.title}</span></span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((vr: any) => (
                  <button key={vr.id} onClick={() => { setSelectedVariant(vr); setQuantity(1); }}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      selectedVariant?.id === vr.id
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-border hover:border-accent/50'
                    } ${vr.inventory_quantity <= 0 ? 'opacity-50 line-through' : ''}`}
                    disabled={vr.inventory_quantity <= 0}>
                    {vr.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {v && (
            <p className={`text-sm font-medium ${inStock ? (v.inventory_quantity <= 5 ? 'text-warning' : 'text-success') : 'text-sale'}`}>
              {inStock ? (v.inventory_quantity <= (v.low_stock_threshold || 5) ? `Only ${v.inventory_quantity} left!` : '✓ In Stock') : 'Out of Stock'}
            </p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2.5 hover:bg-secondary rounded-l-lg transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(v?.inventory_quantity || 1, q + 1))} className="p-2.5 hover:bg-secondary rounded-r-lg transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" size="lg" onClick={handleAddToCart} disabled={!inStock}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <Button variant="outline" size="lg" onClick={handleBuyNow} disabled={!inStock}>
              Buy Now
            </Button>
          </div>
          <a
            href={`https://wa.me/923187166226?text=${encodeURIComponent(`Hi GrabNWear, I want to buy this product:\n\n*${product.title}*\nID: ${product.id}\nVariant: ${v?.title || 'N/A'}\nPrice: ${v ? formatPrice(v.price) : 'N/A'}\n\nProduct link: ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button type="button" className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white" size="lg">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Order on WhatsApp
            </Button>
          </a>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggle(product.id)} className="text-muted-foreground">
              <Heart className={`h-4 w-4 mr-1.5 ${isWishlisted(product.id) ? 'fill-sale text-sale' : ''}`} />
              {isWishlisted(product.id) ? 'Wishlisted' : 'Add to Wishlist'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare('facebook')} className="text-muted-foreground">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare('twitter')} className="text-muted-foreground">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare()} className="text-muted-foreground">
              <Link2 className="h-4 w-4" />
            </Button>
          </div>

          {v?.sku && <p className="text-xs text-muted-foreground">SKU: {v.sku}</p>}

          {/* Tabs */}
          <Tabs defaultValue="description" className="mt-8 border-t border-border pt-6">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 pb-3">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 pb-3">
                Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 pb-3">Shipping</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              {product.description_html ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description_html }} />
              ) : (
                <p className="text-muted-foreground text-sm">No description available.</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewsSection productId={product.id} reviews={reviews} onReviewAdded={(r: any) => setReviews(prev => [r, ...prev])} />
            </TabsContent>

            <TabsContent value="shipping" className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p>Free standard shipping on orders over {formatPrice(Number(settings.shipping_config?.free_shipping_threshold || '3000'))}. Express shipping available at checkout.</p>
              <p>Returns accepted within 7 days of purchase. Items must be unused and in original packaging.</p>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="font-display text-2xl mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

const ReviewsSection = ({ productId, reviews, onReviewAdded }: { productId: string; reviews: any[]; onReviewAdded: (r: any) => void }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to leave a review.'); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    }).select().single();

    if (error) toast.error('Failed to submit review.');
    else {
      toast.success('Review submitted! It will appear after approval.');
      setTitle('');
      setBody('');
      setRating(5);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Review summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="text-center">
            <div className="text-4xl font-bold">{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}</div>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.map(r => (
        <div key={r.id} className="pb-6 border-b border-border last:border-0">
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-accent text-accent' : 'text-border'}`} />
            ))}
          </div>
          {r.title && <h4 className="font-medium text-sm">{r.title}</h4>}
          {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
          <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
          {r.admin_reply && (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-accent/30">
              <p className="text-xs font-medium">Store Reply</p>
              <p className="text-sm text-muted-foreground">{r.admin_reply}</p>
            </div>
          )}
        </div>
      ))}

      {/* Write review form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4 bg-secondary/50 rounded-xl p-6">
          <h3 className="font-medium">Write a Review</h3>
          <div>
            <span className="text-sm mb-1 block">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}>
                  <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || rating) ? 'fill-accent text-accent' : 'text-border'}`} />
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Review title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Share your experience..." value={body} onChange={e => setBody(e.target.value)} rows={3} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-accent hover:underline">Sign in</Link> to write a review.
        </p>
      )}
    </div>
  );
};

export default ProductDetailPage;
