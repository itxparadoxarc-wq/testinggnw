import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Package, MapPin, Heart } from 'lucide-react';

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl mb-8">My Account</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/account/orders" className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
          <Package className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-medium mb-1">Orders</h3>
          <p className="text-sm text-muted-foreground">View your order history</p>
        </Link>
        <Link to="/account/addresses" className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
          <MapPin className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-medium mb-1">Addresses</h3>
          <p className="text-sm text-muted-foreground">Manage shipping addresses</p>
        </Link>
        <Link to="/account/wishlist" className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
          <Heart className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-medium mb-1">Wishlist</h3>
          <p className="text-sm text-muted-foreground">Saved items</p>
        </Link>
      </div>

      <div className="mt-8 p-6 bg-card rounded-lg border border-border">
        <h2 className="font-display text-xl mb-4">Profile Information</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {profile?.full_name || '—'}</p>
          <p><span className="text-muted-foreground">Email:</span> {user?.email || '—'}</p>
          <p><span className="text-muted-foreground">Phone:</span> {profile?.phone || '—'}</p>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => signOut()}>Sign Out</Button>
      </div>
    </div>
  );
};

export default AccountPage;
