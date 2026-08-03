import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/currency';
import { playPop, playSuccess } from '@/lib/sounds';


interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    images: { url: string; alt_text?: string }[];
    variants: { id: string; price: number; compare_at_price?: number | null; inventory_quantity: number; title: string }[];
    tags?: string[];
  };
}

const ProductCard = React.memo(React.forwardRef<HTMLDivElement, ProductCardProps>(({ product }, ref) => {
  const addItem = useCart((s) => s.addItem);
  const toggle = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlist((s) => s.isWishlisted);
  const user = useAuth((s) => s.user);
  const mainImage = product.images[0];
  const secondImage = product.images[1];
  const variant = product.variants[0];
  const isOnSale = variant?.compare_at_price && variant.compare_at_price > variant.price;
  const isNew = product.tags?.includes('new');
  const inStock = variant?.inventory_quantity > 0;

  const discount = isOnSale && variant?.compare_at_price 
    ? Math.round((1 - variant.price / variant.compare_at_price) * 100) 
    : 0;



  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant || !inStock) return;
    playSuccess();
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      price: variant.price,
      image: mainImage?.url || '',
      maxQuantity: variant.inventory_quantity,
    });
  };

  return (
    <div ref={ref} className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="aspect-[3/4] overflow-hidden rounded-xl bg-secondary relative shadow-md hover:shadow-xl transition-shadow duration-300">
          {mainImage && (
            <img src={mainImage.url} alt={mainImage.alt_text || product.title}
              className={`w-full h-full object-cover transition-[opacity,transform] duration-300 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
              loading="lazy" decoding="async" />
          )}
          {secondImage && (
            <img src={secondImage.url} alt={secondImage.alt_text || product.title}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" loading="lazy" decoding="async" />

          )}
          {!mainImage && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {isOnSale && <Badge className="bg-sale text-sale-foreground text-xs font-semibold shadow-sm">-{discount}%</Badge>}
            {isNew && <Badge className="bg-primary text-primary-foreground text-xs font-semibold shadow-sm">New</Badge>}
          </div>

          {!inStock && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <span className="bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-full">Sold Out</span>
            </div>
          )}

          <button onClick={(e) => { e.preventDefault(); playPop(); toggle(product.id, user?.id); }}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm transition-all hover:scale-110 z-20">
            <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? 'fill-sale text-sale' : 'text-foreground/70'}`} />
          </button>

          {inStock && (
            <div className="absolute bottom-3 left-3 right-3 z-20 transition-all duration-300 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0">
              <Button size="sm" className="w-full rounded-full shadow-lg" onClick={handleAddToCart}>
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1 px-0.5">
          <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{product.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{formatPrice(variant?.price || 0)}</span>
            {isOnSale && variant?.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(variant.compare_at_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}));

ProductCard.displayName = 'ProductCard';
export default ProductCard;
