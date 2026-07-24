import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/storefront/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LayoutGrid, List, X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

const ITEMS_PER_PAGE = 12;

const CollectionsPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [collection, setCollection] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Read filters from URL
  const sortBy = searchParams.get('sort') || 'newest';
  const selectedCategory = searchParams.get('category') || '';
  const urlMinPrice = Number(searchParams.get('min_price') || 0);
  const urlMaxPrice = Number(searchParams.get('max_price') || 50000);
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const page = Number(searchParams.get('page') || 1);

  // Local slider state to avoid lag
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([urlMinPrice, urlMaxPrice]);
  const priceCommitRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Sync local state when URL changes externally
  useEffect(() => {
    setLocalPriceRange([urlMinPrice, urlMaxPrice]);
  }, [urlMinPrice, urlMaxPrice]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      if (slug) {
        const { data: col } = await supabase.from('collections').select('*').eq('slug', slug).maybeSingle();
        setCollection(col);
      } else {
        setCollection(null);
      }

      let query = supabase.from('products').select('*, product_images(*), product_variants(*), categories(name, slug)').eq('status', 'active');

      if (slug) {
        const { data: colData } = await supabase.from('collections').select('id').eq('slug', slug).maybeSingle();
        if (colData) {
          const { data: cpData } = await supabase.from('collection_products').select('product_id').eq('collection_id', colData.id);
          const ids = (cpData || []).map(cp => cp.product_id);
          if (ids.length > 0) {
            query = query.in('id', ids);
          } else {
            setProducts([]);
            setLoading(false);
            return;
          }
        }
      }

      if (selectedCategory) {
        const { data: catData } = await supabase.from('categories').select('id').eq('slug', selectedCategory).maybeSingle();
        if (catData) query = query.eq('category_id', catData.id);
      }

      switch (sortBy) {
        case 'price_asc':
        case 'price_desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'title_asc':
          query = query.order('title', { ascending: true });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data } = await query;
      if (data) {
        setProducts(data.map(p => ({
          ...p,
          images: p.product_images || [],
          variants: p.product_variants || [],
          category: p.categories,
        })));
      }
      setLoading(false);
    };

    supabase.from('categories').select('*').is('parent_id', null).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data); });

    fetchAll();
  }, [slug, sortBy, selectedCategory, inStockOnly]);

  // Client-side price + stock filtering and sorting
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const v = p.variants[0];
      if (!v) return true;
      if (v.price < urlMinPrice || v.price > urlMaxPrice) return false;
      if (inStockOnly && v.inventory_quantity <= 0) return false;
      return true;
    });

    if (sortBy === 'price_asc') result.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    if (sortBy === 'price_desc') result.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));

    return result;
  }, [products, urlMinPrice, urlMaxPrice, inStockOnly, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    // Only reset page when changing filters, not when changing page itself
    if (key !== 'page') params.delete('page');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const commitPriceRange = useCallback((range: [number, number]) => {
    const params = new URLSearchParams(searchParams);
    if (range[0] > 0) params.set('min_price', String(range[0]));
    else params.delete('min_price');
    if (range[1] < 50000) params.set('max_price', String(range[1]));
    else params.delete('max_price');
    params.delete('page');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handlePriceChange = useCallback((values: number[]) => {
    setLocalPriceRange([values[0], values[1]]);
    // Debounce the URL update
    if (priceCommitRef.current) clearTimeout(priceCommitRef.current);
    priceCommitRef.current = setTimeout(() => {
      commitPriceRange([values[0], values[1]]);
    }, 500);
  }, [commitPriceRange]);

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = [selectedCategory, inStockOnly, urlMinPrice > 0, urlMaxPrice < 50000].filter(Boolean).length;

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {slug ? (
          <>
            <Link to="/collections" className="hover:text-foreground transition-colors">Collections</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{collection?.name || slug}</span>
          </>
        ) : (
          <span className="text-foreground">All Products</span>
        )}
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl">{collection?.name || 'All Products'}</h1>
        {collection?.description && <p className="text-muted-foreground text-sm mt-1">{collection.description}</p>}
      </div>

      {/* Active filters + sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="lg:hidden gap-1.5" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
          <span className="text-sm text-muted-foreground">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>

          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              <button onClick={() => updateFilter('category', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {inStockOnly && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              In Stock
              <button onClick={() => updateFilter('in_stock', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={v => updateFilter('sort', v)}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
              <SelectItem value="title_asc">Name: A → Z</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Category</h3>
              <div className="space-y-0.5">
                <button onClick={() => updateFilter('category', '')}
                  className={`flex items-center w-full text-sm px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                  All Categories
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => updateFilter('category', cat.slug)}
                    className={`flex items-center w-full text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h3>
              <div className="px-1">
                <Slider
                  min={0} max={50000} step={500}
                  value={localPriceRange}
                  onValueChange={handlePriceChange}
                  className="mb-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="bg-secondary px-2 py-1 rounded-md font-medium">{formatPrice(localPriceRange[0])}</span>
                  <span className="bg-secondary px-2 py-1 rounded-md font-medium">{formatPrice(localPriceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Availability</h3>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-foreground transition-colors px-1">
                <Checkbox checked={inStockOnly} onCheckedChange={v => updateFilter('in_stock', v ? 'true' : '')} />
                <span className={inStockOnly ? 'text-foreground font-medium' : 'text-muted-foreground'}>In Stock Only</span>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full text-xs">
                Clear All Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Mobile filters */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-background p-6 overflow-y-auto lg:hidden animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-lg hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Category</h3>
                <div className="space-y-0.5">
                  <button onClick={() => updateFilter('category', '')}
                    className={`flex items-center w-full text-sm px-3 py-2.5 rounded-lg transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}>
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => updateFilter('category', cat.slug)}
                      className={`flex items-center w-full text-sm px-3 py-2.5 rounded-lg transition-colors ${selectedCategory === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h3>
                <div className="px-1">
                  <Slider
                    min={0} max={50000} step={500}
                    value={localPriceRange}
                    onValueChange={handlePriceChange}
                    className="mb-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-1 rounded-md font-medium">{formatPrice(localPriceRange[0])}</span>
                    <span className="bg-secondary px-2 py-1 rounded-md font-medium">{formatPrice(localPriceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Availability</h3>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer px-1">
                  <Checkbox checked={inStockOnly} onCheckedChange={v => updateFilter('in_stock', v ? 'true' : '')} />
                  In Stock Only
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              {activeFilterCount > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}>
                  Clear All
                </Button>
              )}
              <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                Show {filteredProducts.length} Products
              </Button>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {paginatedProducts.map(p => (
                  viewMode === 'list' ? (
                    <ListProductCard key={p.id} product={p} />
                  ) : (
                    <ProductCard key={p.id} product={p} />
                  )
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => updateFilter('page', String(p))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <SlidersHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">No products found.</p>
              {activeFilterCount > 0 && (
                <Button variant="link" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ListProductCard = ({ product }: { product: any }) => {
  const mainImage = product.images[0];
  const variant = product.variants[0];
  const isOnSale = variant?.compare_at_price && variant.compare_at_price > variant.price;

  return (
    <Link to={`/products/${product.slug}`} className="flex gap-4 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
        {mainImage && <img src={mainImage.url} alt={product.title} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">{product.title}</h3>
        {product.category?.name && <p className="text-xs text-muted-foreground">{product.category.name}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold">{formatPrice(variant?.price || 0)}</span>
          {isOnSale && <span className="text-xs text-muted-foreground line-through">{formatPrice(variant.compare_at_price)}</span>}
        </div>
      </div>
    </Link>
  );
};

export default CollectionsPage;
