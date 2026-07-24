import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StorefrontHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    supabase.from('categories').select('*').is('parent_id', null).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.from('products').select('id, title, slug, product_images(url), product_variants(price)')
        .eq('status', 'active').ilike('title', `%${searchQuery.trim()}%`).limit(5);
      setSearchResults(data || []);
      setSearchOpen(true);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      {/* Announcement Bar */}
      {!announcementDismissed && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm relative">
          <span>🚚 Free delivery on orders above {formatPrice(Number(settings.shipping_config?.free_shipping_threshold || '3000'))}!</span>
          <button onClick={() => setAnnouncementDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <div className="border-b border-border">
        <div className="container-page flex items-center h-16 gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button className="lg:hidden p-2 -ml-2 shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-1.5 sm:gap-2 mr-auto lg:mr-0">
            <img
              src="/assets/logo.webp"
              alt={settings.store_name}
              className="h-7 sm:h-9 w-auto object-contain"
            />
            <span className="font-display text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{settings.store_name}</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium ml-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors outline-none">
                Shop <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem asChild><Link to="/collections">All Products</Link></DropdownMenuItem>
                {categories.length > 0 && <DropdownMenuSeparator />}
                {categories.map(cat => (
                  <DropdownMenuItem key={cat.id} asChild>
                    <Link to={`/collections?category=${cat.slug}`}>{cat.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/collections/new-arrivals" className="hover:text-primary transition-colors">New Arrivals</Link>
            <Link to="/collections/on-sale" className="hover:text-primary transition-colors text-sale font-semibold">Sale</Link>
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Search */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-xs relative ml-auto">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-full border-0 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground transition-all"
                />
              </div>
            </form>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                {searchResults.map(p => (
                  <Link key={p.id} to={`/products/${p.slug}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {p.product_images?.[0]?.url && <img src={p.product_images[0].url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      {p.product_variants?.[0] && <p className="text-xs text-primary font-semibold">{formatPrice(Number(p.product_variants[0].price))}</p>}
                    </div>
                  </Link>
                ))}
                <Link to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="block text-center text-sm text-primary py-3 border-t border-border hover:bg-secondary transition-colors font-medium">
                  View all results →
                </Link>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 ml-auto md:ml-0">
            <a
              href="https://wa.me/923187166226?text=Hi%20GrabNWear%2C%20I%20want%20to%20order%20something"
              target="_blank"
              rel="noopener noreferrer"
              className="relative p-2 sm:p-2.5 hover:text-[#25D366] transition-colors rounded-full hover:bg-secondary"
              aria-label="Chat on WhatsApp"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>

            <Link to="/account/wishlist" className="relative p-2 sm:p-2.5 hover:text-primary transition-colors rounded-full hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                  {wishlistCount}
                </Badge>
              )}
            </Link>

            <button onClick={() => { setIsOpen(true); setMobileMenuOpen(false); }} className="relative p-2 sm:p-2.5 hover:text-primary transition-colors rounded-full hover:bg-secondary">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                  {itemCount}
                </Badge>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 sm:p-2.5 hover:text-primary transition-colors rounded-full hover:bg-secondary">
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem asChild><Link to="/account" onClick={() => setMobileMenuOpen(false)}>My Account</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/orders" onClick={() => setMobileMenuOpen(false)}>Orders</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/wishlist" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link></DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link></DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { signOut(); setMobileMenuOpen(false); }}>Sign Out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild><Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Create Account</Link></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 px-4 space-y-1 bg-background animate-fade-in">
            <form onSubmit={handleSearch} className="md:hidden mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-full outline-none" />
              </div>
            </form>
            <Link to="/" className="block py-2.5 px-3 font-medium rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/collections" className="block py-2.5 px-3 font-medium rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/collections?category=${cat.slug}`} className="block py-2 px-6 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link to="/collections/new-arrivals" className="block py-2.5 px-3 font-medium rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>New Arrivals</Link>
            <Link to="/collections/on-sale" className="block py-2.5 px-3 font-medium text-sale rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>Sale</Link>
            <Link to="/blog" className="block py-2.5 px-3 font-medium rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link to="/contact" className="block py-2.5 px-3 font-medium rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default StorefrontHeader;
