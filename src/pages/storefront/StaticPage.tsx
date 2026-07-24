import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Shield, Award, Sparkles, HelpCircle, Heart, ChevronDown } from 'lucide-react';
import PageTransition from '@/components/storefront/PageTransition';
import { playPop } from '@/lib/sounds';

// Bespoke Accordion Item for FAQ page
const FaqAccordion = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/10 dark:border-white/5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden">
      <button 
        onClick={() => { playPop(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between p-5 text-left font-display font-medium text-base md:text-lg focus:outline-none"
      >
        <span>{question}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-72 border-t border-white/5 opacity-100 p-5' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const StaticPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase.from('pages').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
      .then(({ data }) => { 
        setPage(data); 
        setLoading(false); 
      });
  }, [slug]);

  if (loading) return (
    <div className="container-page py-16 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  // 1. Bespoke "About Us" Page Interceptor
  if (slug === 'about') {
    return (
      <PageTransition>
        <div className="w-full pb-20 bg-background">
          {/* Breadcrumb & Title */}
          <div className="container-page py-6">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">About GrabNWear</span>
            </nav>
          </div>

          {/* Hero Section */}
          <section className="relative w-full h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden border-b border-border/40 bg-zinc-950">
            <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
              <img 
                src="/assets/about-atelier.webp" 
                alt="GrabNWear Atelier" 
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="relative z-10 text-center px-4 max-w-4xl">
              <span className="text-[10px] md:text-xs font-extrabold tracking-widest uppercase text-primary bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">The Atelier Blueprint</span>
              <h1 className="font-display text-4xl md:text-6xl tracking-tight text-white mt-4 font-black">
                REDEFINING STREET <br className="hidden md:block"/>
                <span className="text-gradient">ARMOR FIT.</span>
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mt-4 font-semibold">
                GrabNWear is an independent streetwear house combining technical cyber aesthetics, heavy-drop fits, and ethically sourced organic cotton from Pakistan.
              </p>
            </div>
          </section>

          <div className="container-page px-4 mt-16 md:mt-24 space-y-24">
            {/* The Vision & Story Grid */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-xs uppercase font-extrabold text-primary tracking-widest">Our Vision</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl tracking-tight font-extrabold">
                  Born in the Streets, <br />
                  <span className="text-muted-foreground">Tailored with Honor.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Pakistan is one of the world's leading cotton textile exporters, yet its artisans are rarely given the credit or fair wages they deserve, and local brands rarely push the limits of modern technical garments. 
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  GrabNWear was founded to disrupt this blueprint. We bridge the gap between high-end organic materials and local tailors in Lahore. By combining strict technical fits with Pakistan's premium heavy-weight organic double-fleece cotton (up to 450 GSM), we create armor-like garments built to hold their shape for a lifetime.
                </p>
              </div>

              {/* Atelier Picture */}
              <div className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src="/assets/about-atelier.webp" 
                  alt="Lahore Streetwear Design Studio" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-xs font-mono text-emerald-400 bg-black/80 border border-white/10 px-3 py-1.5 rounded">
                  GRABNWEAR_STUDIO_LH.EXE
                </div>
              </div>
            </div>

            {/* Statistics and Technical Standards */}
            <div className="py-12 border-y border-border/40">
              <div className="text-center max-w-xl mx-auto mb-12">
                <h3 className="font-display text-2xl font-bold tracking-tight mb-2">Technical Standards</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Precision measurements on every stitch</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { value: '450 GSM', label: 'Double-fleece density for rigid silhouette armor.' },
                  { value: '100% Cotton', label: 'Ultra-soft sustainable organic Pakistani fibers.' },
                  { value: 'Double Stitch', label: 'Reinforced needle seams preventing shape loss.' },
                  { value: 'Zero-Carbon', label: 'Shipped in biodegradable metallic ziplock pods.' }
                ].map(stat => (
                  <div key={stat.value} className="p-6 rounded-2xl bg-secondary/15 border border-white/5 text-center">
                    <div className="text-xl md:text-2xl font-extrabold text-primary font-display mb-1">{stat.value}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sourcing & Artisans Grid */}
            <div className="grid lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
              <div className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl lg:order-last">
                <img 
                  src="/assets/about-artisans.webp" 
                  alt="Pakistani Tailor Stitching Heavy Fleece" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-xs font-mono text-emerald-400 bg-black/80 border border-white/10 px-3 py-1.5 rounded">
                  HAND_CRAFT_LAHORE.RAW
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs uppercase font-extrabold text-primary tracking-widest">Ethical Craftsmanship</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl tracking-tight font-extrabold">
                  Hand-Cut & Sewn <br />
                  <span className="text-muted-foreground">With Absolute Precision.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Every single zipper, panel-cut, and drop-shoulder sleeve is aligned, hand-cut, and double-needle flatlock stitched by veteran tailoring masters right in our Lahore workspace.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  By paying fair salaries, supporting clean workshop environments, and sourcing fabric from sustainable local farms, we keep our community thriving and make garments that feel distinct the second you put them on.
                </p>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="p-8 md:p-12 rounded-3xl bg-secondary/15 border border-white/10 text-center relative overflow-hidden max-w-4xl mx-auto shadow-2xl">
              <div className="absolute top-0 right-0 p-3 text-primary/10 select-none pointer-events-none">
                <Award className="h-44 w-44" />
              </div>
              <h3 className="font-display text-xl md:text-3xl font-extrabold tracking-tight mb-4">Support Local. wear Future.</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                Be a part of a sustainable, fair-trade streetwear movement that values the craft and the artisans who sew your clothes.
              </p>
              <Link to="/collections" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg transition-all hover:scale-105 duration-300">
                Explore Sourced Drops
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 2. Bespoke "FAQ" Page Interceptor
  if (slug === 'faq') {
    return (
      <PageTransition>
        <div className="container-page py-10 max-w-4xl mx-auto px-4 pb-24">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">FAQ</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary">Got Questions?</span>
          </div>
          
          <h1 className="font-display text-3xl md:text-5xl mb-4 font-black tracking-tight">
            Frequently Asked <span className="text-gradient">Questions.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm md:text-base mb-12">
            Everything you need to know about our heavy-fleece streetwear drops, local shipping times, sizes, and returns.
          </p>

          <div className="space-y-12">
            {/* Category: Shipping */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-extrabold font-mono text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Delivery & Shipping
              </h3>
              <div className="grid gap-3.5">
                <FaqAccordion 
                  question="How long will it take for my order to arrive?" 
                  answer="Orders within Pakistan typically take 2-4 business days to arrive. Orders in Lahore usually arrive within 1-2 days. Standard shipping is free on orders above Rs. 3,500!" 
                />
                <FaqAccordion 
                  question="Do you offer Cash on Delivery (COD)?" 
                  answer="Yes! Cash on Delivery is 100% supported and preferred across Pakistan. You can pay our courier partner in cash upon receiving your clothing." 
                />
                <FaqAccordion 
                  question="How can I track my shipment?" 
                  answer="As soon as your drop leaves our Lahore workshop, we will automatically send you an SMS with the shipping courier details and tracking link." 
                />
              </div>
            </div>

            {/* Category: Sizing & Quality */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-extrabold font-mono text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Sizing & Fabric Quality
              </h3>
              <div className="grid gap-3.5">
                <FaqAccordion 
                  question="What does 450 GSM mean?" 
                  answer="GSM stands for Grams per Square Meter. Standard hoodies are 250-300 GSM. Our streetwear hoodies are made of 450 GSM double-fleece cotton—this means they are extremely heavy-weight, hold a rigid boxy drop shoulder silhouette, and provide structural protection." 
                />
                <FaqAccordion 
                  question="How should I choose my size for streetwear hoodies?" 
                  answer="All of our drop clothing is engineered with an 'oversized streetwear fit' by default. If you prefer the authentic baggier fit, order your normal size. If you want a more standard, fitted look, we recommend sizing down one size." 
                />
                <FaqAccordion 
                  question="How do I wash my heavy fleece cotton?" 
                  answer="To keep the structural shape and prevent shrinking, we recommend cold washing inside out and hanging to dry. Avoid high heat tumble dryers." 
                />
              </div>
            </div>

            {/* Category: Returns */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-extrabold font-mono text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Returns & Exchanges
              </h3>
              <div className="grid gap-3.5">
                <FaqAccordion 
                  question="What is your return policy?" 
                  answer="We offer a hassle-free 7-day exchange and return policy on all unworn items. If your hoodie size is not perfect, simply contact our team via WhatsApp (+92 318 7166226) and we will send a courier to swap it for you!" 
                />
                <FaqAccordion 
                  question="Can I cancel my order?" 
                  answer="Yes, as long as it has not shipped out of our atelier yet. Please contact us immediately on WhatsApp or email to process cancellations." 
                />
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 3. Fallback for other Supabase-driven policy pages (like privacy-policy, terms, shipping-policy)
  if (!page) return (
    <div className="container-page py-20 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <h1 className="font-display text-2xl mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or hasn't been published yet.</p>
      <Link to="/" className="text-primary hover:underline font-medium">← Back to Home</Link>
    </div>
  );

  return (
    <PageTransition>
      <div className="container-page py-10 max-w-3xl mx-auto px-4 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{page.title}</span>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl mb-8 font-black">{page.title}</h1>
        {page.content_html ? (
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content_html }} />
        ) : (
          <p className="text-muted-foreground">No content available.</p>
        )}
      </div>
    </PageTransition>
  );
};

export default StaticPage;
