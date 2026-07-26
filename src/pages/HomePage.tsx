import React, { useEffect, useState, memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, ChevronLeft, ChevronRight, ShieldCheck, Truck, RotateCcw, CreditCard, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import { motion, useReducedMotion } from 'framer-motion';
import FloatingElement from '@/components/storefront/FloatingElement';
import ParallaxSection from '@/components/storefront/ParallaxSection';
import Tilt3DCard from '@/components/storefront/Tilt3DCard';
import StoryTimeline from '@/components/storefront/StoryTimeline';

const TRUST_ICONS: Record<string, any> = {
  'Free Delivery': Truck,
  'Easy Returns': RotateCcw,
  'Secure Checkout': ShieldCheck,
  'COD Available': CreditCard
};

const HomePage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { settings } = useStoreSettings();
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, collectionsRes, newRes, catRes] = await Promise.all([
        supabase.from('products').select('*, product_images(*), product_variants(*)').eq('status', 'active').limit(8),
        supabase.from('collections').select('*').limit(6),
        supabase.from('products').select('*, product_images(*), product_variants(*)').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
        supabase.from('categories').select('*').order('sort_order').limit(6)
      ]);

      const mapProducts = (data: any[]) => data.map((p) => ({
        ...p, images: p.product_images || [], variants: p.product_variants || []
      }));

      if (productsRes.data) setProducts(mapProducts(productsRes.data));
      if (newRes.data) setNewArrivals(mapProducts(newRes.data));
      if (collectionsRes.data) setCollections(collectionsRes.data);
      if (catRes.data) setCategories(catRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const slides = settings.hero_slides;

  useEffect(() => {
    if (slides.length === 0) return;
    let cancelled = false;
    const firstImg = new Image();
    firstImg.onload = () => { if (!cancelled) setImagesLoaded(true); };
    firstImg.onerror = () => { if (!cancelled) setImagesLoaded(true); };
    firstImg.src = slides[0].bg;
    return () => { cancelled = true; };
  }, [slides]);

  useEffect(() => {
    if (slides.length === 0 || !imagesLoaded) return;
    const timer = setInterval(() => setCurrentSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length, imagesLoaded]);

  // Touch swipe for hero carousel
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrentSlide((s) => diff > 0 ? (s + 1) % slides.length : (s - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
  };

  return (
    <div>
      {/* Hero Carousel with 3D depth */}
      {slides.length > 0 && (
        <section className="relative overflow-hidden h-[480px] sm:h-[520px] lg:h-[680px]" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {!imagesLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

          {imagesLoaded && slides.map((slide, idx) => (
            <div
              key={idx}
              className="absolute inset-0 will-change-[opacity] transition-opacity duration-700 ease-in-out"
              style={{ opacity: idx === currentSlide ? 1 : 0, zIndex: idx === currentSlide ? 1 : 0 }}
            >
              <img src={slide.bg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading={idx === 0 ? 'eager' : 'lazy'} decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/20" />
              <div className="relative container-page h-full flex items-center">
                <div
                  className="max-w-xl transition-all duration-700 ease-out"
                  style={{
                    opacity: idx === currentSlide ? 1 : 0,
                    transform: idx === currentSlide ? 'translateY(0)' : 'translateY(24px)',
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 text-white/90 text-sm font-medium mb-4 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                    <Sparkles className="h-3.5 w-3.5" /> {settings.store_name}
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white leading-[1.1] mb-5">
                    {slide.title}
                  </h1>
                  <p className="text-white/75 text-sm sm:text-base lg:text-lg mb-8 max-w-md leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base px-6 sm:px-8 rounded-full shadow-lg">
                      <Link to={slide.cta_link}>
                        {slide.cta_text} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" className="bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 border border-white/20 text-sm sm:text-base rounded-full">
                      <Link to="/collections">Browse All</Link>
                    </Button>
                  </div>
                </div>

                {/* Floating 3D decorative elements */}
                <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2" style={{ perspective: '600px' }}>
                  <FloatingElement duration={5} yRange={20} rotateRange={5}>
                    <div className="w-24 h-24 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl" style={{ transform: 'rotateY(-15deg) rotateX(10deg)' }} />
                  </FloatingElement>
                  <FloatingElement duration={6} delay={1} yRange={15} className="absolute -top-16 -left-20">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/20" style={{ transform: 'rotateY(20deg) rotateX(-5deg)' }} />
                  </FloatingElement>
                  <FloatingElement duration={7} delay={2} yRange={10} className="absolute -bottom-12 left-8">
                    <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10" style={{ transform: 'rotateY(-10deg) rotateX(15deg)' }} />
                  </FloatingElement>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => setCurrentSlide((s) => (s - 1 + slides.length) % slides.length)}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all text-white z-10 hover:scale-110">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setCurrentSlide((s) => (s + 1) % slides.length)}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all text-white z-10 hover:scale-110">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-primary w-8' : 'bg-white/40 w-4 hover:bg-white/60'}`} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Marquee with 3D depth */}
      <section className="bg-primary text-primary-foreground py-3 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="flex animate-marquee whitespace-nowrap gap-8 text-sm font-medium uppercase tracking-widest relative">
          {['Hoodies', 'T-Shirts', 'Jackets', 'Sneakers', 'Accessories', 'Denim', 'Sportswear', 'Dresses', 'Hoodies', 'T-Shirts', 'Jackets', 'Sneakers', 'Accessories', 'Denim', 'Sportswear', 'Dresses'].map((cat, i) => (
            <span key={i} className="flex items-center gap-8">
              {cat} <span className="text-primary-foreground/40">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Trending / Best Sellers with parallax */}
      <ParallaxSection speed={0.1}>
        <section className="container-page py-12 sm:py-16">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <span className="text-primary text-sm font-semibold uppercase tracking-wider">Best Sellers</span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mt-1">Trending Now</h2>
              </div>
              <Link to="/collections" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </ScrollReveal>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-16 sm:py-20 bg-card rounded-2xl border border-border">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-2">Coming Soon</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">We're curating amazing products for you. Check back soon!</p>
            </div>
          )}
        </section>
      </ParallaxSection>

      {/* Shop by Category with 3D tilt cards */}
      {categories.length > 0 && (
        <section className="container-page py-12 sm:py-16">
          <ScrollReveal className="text-center mb-8 sm:mb-10">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Categories</span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mt-1">Shop by Category</h2>
          </ScrollReveal>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <StaggerItem key={cat.id}>
                <Tilt3DCard tiltIntensity={10} className="relative">
                  <Link to={`/collections?category=${cat.slug}`}
                    className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-secondary block shadow-md hover:shadow-xl transition-shadow duration-300">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="font-display text-lg text-primary/30">{cat.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                      <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
                    </div>
                  </Link>
                </Tilt3DCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="bg-secondary/50">
          <ParallaxSection speed={0.08}>
            <div className="container-page py-12 sm:py-16">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div>
                    <span className="text-primary text-sm font-semibold uppercase tracking-wider">Fresh Drops</span>
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mt-1">New Arrivals</h2>
                  </div>
                  <Link to="/collections/new-arrivals" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </ScrollReveal>
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {newArrivals.map((p) => (
                  <StaggerItem key={p.id}>
                    <ProductCard product={p} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ParallaxSection>
        </section>
      )}

      {/* Promo Banner with 3D floating elements */}
      <ScrollReveal>
        <section className="container-page py-12 sm:pb-16">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="hidden md:block absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative p-8 sm:p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-1 space-y-3 sm:space-y-4 text-center lg:text-left">
                <span className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Limited Time Offer</span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl leading-tight">Up to 40% Off Selected Items</h2>
                <p className="text-primary-foreground/80 text-sm sm:text-base max-w-md mx-auto lg:mx-0">Don't miss our biggest sale of the season. Premium quality at unbeatable prices.</p>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full shadow-lg mt-2">
                  <Link to="/collections/on-sale">Shop the Sale <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <FloatingElement duration={5} yRange={18} rotateRange={8}>
                <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-white/10 flex items-center justify-center text-6xl sm:text-8xl shadow-2xl border border-white/10">
                  🛍️
                </div>
              </FloatingElement>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured Collections with 3D tilt */}
      {collections.length > 0 && (
        <section className="bg-secondary/50">
          <div className="container-page py-12 sm:py-16">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <span className="text-primary text-sm font-semibold uppercase tracking-wider">Curated</span>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mt-1">Our Collections</h2>
                </div>
                <Link to="/collections" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {collections.slice(0, 4).map((col) => (
                <StaggerItem key={col.id}>
                  <Tilt3DCard tiltIntensity={8} className="relative">
                    <Link to={`/collections/${col.slug}`}
                      className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-secondary block shadow-md hover:shadow-xl transition-shadow duration-300">
                      {col.image_url ? (
                        <img src={col.image_url} alt={col.name} loading="lazy" decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 sm:p-5">
                        <div>
                          <h3 className="text-white font-display text-base sm:text-xl">{col.name}</h3>
                          {col.description && <p className="text-white/70 text-xs sm:text-sm mt-1 line-clamp-1">{col.description}</p>}
                        </div>
                      </div>
                    </Link>
                  </Tilt3DCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Brand Storytelling Timeline */}
      <StoryTimeline />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Payment Methods */}
      <PaymentMethodsBar />
    </div>
  );
};

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('reviews').select('id, rating, title, body, created_at, user_id').eq('status', 'approved').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  const sampleTestimonials = [
    { id: '1', rating: 5, title: 'Best quality ever', body: 'GrabNWear hoodies are the best I have ever owned. The fabric is thick, soft, and holds shape after many washes.', name: 'Ahmed K.' },
    { id: '2', rating: 5, title: 'Amazing fit', body: 'The oversized fit is exactly what I wanted. Great streetwear from Pakistan!', name: 'Fatima R.' },
    { id: '3', rating: 4, title: 'Premium feel', body: 'The stitching and cotton quality is next level. Worth every rupee.', name: 'Bilal S.' },
  ];

  const testimonials = reviews.length > 0
    ? reviews.map(r => ({ ...r, name: 'Customer' }))
    : sampleTestimonials;

  if (testimonials.length === 0) return null;

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <span className="text-primary text-sm font-semibold uppercase tracking-wider">Reviews</span>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl mt-1">What Our Customers Say</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow duration-300">
            <div className="flex gap-0.5 mb-3">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= (t.rating || 5) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            {t.title && <h3 className="font-medium text-sm mb-2">{t.title}</h3>}
            {t.body && <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>}
            <p className="text-xs text-muted-foreground mt-3">{t.name || 'Verified Customer'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const NewsletterSection = () => {
  const { settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() });
    if (error) {
      if (error.code === '23505') toast.info("You're already subscribed!");
      else toast.error('Something went wrong');
    } else {
      toast.success('Welcome aboard! 🎉');
      setEmail('');
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Trust Badges with 3D hover */}
      <ScrollReveal>
        <section className="border-b border-border bg-card">
          <div className="container-page py-5 sm:py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {settings.trust_badges.map(({ label, desc }) => {
                const Icon = TRUST_ICONS[label] || ShieldCheck;
                return (
                  <Tilt3DCard key={label} tiltIntensity={8} scale={1.05} glareEnabled={false} className="relative">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">{label}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </Tilt3DCard>
                );
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-primary text-primary-foreground">
          <div className="container-page py-12 sm:py-16 text-center">
            <h2 className="font-display text-2xl sm:text-3xl mb-3">Stay in the Loop</h2>
            <p className="text-primary-foreground/70 text-sm sm:text-base mb-6 max-w-md mx-auto">Subscribe and get exclusive deals, early access to new drops, and style tips.</p>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-white/15 border border-white/20 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              <Button type="submit" disabled={submitting} className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shrink-0">
                {submitting ? '...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
};

const PaymentMethodsBar = () => {
  const { settings } = useStoreSettings();
  const pm = settings.payment_methods;

  const methods = [
    { key: 'cod', enabled: pm.cod, label: 'Cash on Delivery', logo: '/__l5e/assets-v1/0c8414fb-15e4-49d0-835a-3e185843e440/payment-cod.png' },
    { key: 'stripe', enabled: pm.stripe, label: 'Visa / Mastercard', icon: '💳' },
    { key: 'jazzcash', enabled: pm.jazzcash, label: 'JazzCash', logo: '/__l5e/assets-v1/87908764-5adb-4d14-988d-dec005844eb7/payment-jazzcash.png' },
    { key: 'easypaisa', enabled: pm.easypaisa, label: 'EasyPaisa', logo: '/__l5e/assets-v1/e7e406c5-5c12-46aa-866f-773f7dec3fd1/payment-easypaisa.png' },
  ].filter((m) => m.enabled);

  if (methods.length === 0) return null;

  return (
    <ScrollReveal>
      <section className="border-t border-border bg-card">
        <div className="container-page py-6 text-center">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Accepted Payment Methods</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {methods.map((m) => (
              <Tilt3DCard key={m.key} tiltIntensity={10} scale={1.08} className="relative">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border shadow-sm hover:shadow-md transition-shadow">
                  {'logo' in m && m.logo ? (
                    <img src={m.logo} alt={m.label} className="h-7 w-auto object-contain" loading="lazy" />
                  ) : 'icon' in m && m.icon ? (
                    <span className="text-lg">{m.icon}</span>
                  ) : null}
                  <span className="text-sm font-medium">{m.label}</span>
                </div>
              </Tilt3DCard>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default HomePage;
