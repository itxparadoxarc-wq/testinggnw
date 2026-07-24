import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

const WishlistPage = () => {
  const { user } = useAuth();
  const { items: wishlistIds, toggle } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) { setProducts([]); setLoading(false); return; }
    supabase.from('products').select('*, product_images(*), product_variants(*)')
      .in('id', wishlistIds).then(({ data }) => {
        setProducts((data || []).map(p => ({ ...p, images: p.product_images || [], variants: p.product_variants || [] })));
        setLoading(false);
      });
  }, [wishlistIds]);

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted-foreground">Please <Link to="/login" className="text-accent hover:underline">sign in</Link> to view your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl mb-8">My Wishlist</h1>
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
          <Button asChild><Link to="/collections">Browse Products</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => {
            const v = p.variants[0];
            const img = p.images[0];
            return (
              <div key={p.id} className="border border-border rounded-lg overflow-hidden">
                <Link to={`/products/${p.slug}`} className="block aspect-[3/4] bg-secondary">
                  {img && <img src={img.url} alt={p.title} className="w-full h-full object-cover" />}
                </Link>
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-medium truncate">{p.title}</h3>
                  <p className="text-sm font-semibold">{formatPrice(v?.price || 0)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs" onClick={() => v && addItem({
                      productId: p.id, variantId: v.id, title: p.title, variantTitle: v.title,
                      price: v.price, image: img?.url || '', maxQuantity: v.inventory_quantity,
                    })}>
                      <ShoppingBag className="h-3 w-3 mr-1" /> Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
