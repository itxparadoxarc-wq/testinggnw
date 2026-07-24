import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { formatPrice } from '@/lib/currency';

const CartPage = () => {
  const { items, removeItem, updateQuantity, subtotal, discountAmount, total, applyDiscount } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    await applyDiscount(coupon);
    setApplying(false);
  };

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added any items yet.</p>
        <Button asChild><Link to="/collections">Start Shopping</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.variantId} className="flex gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-secondary shrink-0">
                {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{item.title}</h3>
                {item.variantTitle && <p className="text-xs text-muted-foreground">{item.variantTitle}</p>}
                <p className="font-semibold text-sm mt-1">{formatPrice(item.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border border-border rounded-md">
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-1.5 hover:bg-secondary">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-1.5 hover:bg-secondary">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg border border-border p-6 h-fit space-y-4">
          <h2 className="font-display text-lg">Order Summary</h2>
          <div className="flex gap-2">
            <Input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Discount code" className="text-sm" />
            <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={applying}>Apply</Button>
          </div>
          <div className="space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPrice(discountAmount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>Calculated at checkout</span></div>
            <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate('/checkout')}>Proceed to Checkout</Button>
          <Button variant="outline" className="w-full" asChild><Link to="/collections">Continue Shopping</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
