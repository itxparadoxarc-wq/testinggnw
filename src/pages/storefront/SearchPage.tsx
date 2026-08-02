import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/storefront/ProductCard';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'relevance';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setProducts([]); return; }
    setLoading(true);
    supabase.from('products').select('id, title, slug, tags, created_at, product_images(id, url, alt_text, position), product_variants(id, title, price, compare_at_price, inventory_quantity, is_active)')
      .eq('status', 'active').ilike('title', `%${query}%`).limit(40)
      .then(({ data, error }) => {
        if (error) console.error('Failed to search products', error);
        setProducts((data || []).map(p => ({ ...p, images: p.product_images || [], variants: p.product_variants || [] })));
        setLoading(false);
      });
  }, [query]);

  const sorted = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price_asc') list.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    if (sortBy === 'price_desc') list.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products, sortBy]);

  const updateSort = (v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', v);
    setSearchParams(params);
  };

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Search</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Search Results</h1>
          {query && <p className="text-muted-foreground text-sm mt-1">Showing {sorted.length} result{sorted.length !== 1 ? 's' : ''} for "{query}"</p>}
        </div>
        {sorted.length > 0 && (
          <Select value={sortBy} onValueChange={updateSort}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">{query ? 'No results found' : 'Start typing to search'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? 'Try different keywords or browse our collections.' : 'Search by product name, category, or keyword.'}
          </p>
          <Link to="/collections" className="text-accent hover:underline text-sm mt-4 inline-block">Browse all products →</Link>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
