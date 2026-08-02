import { useEffect, useRef, useState } from 'react';
import { playPop } from '@/lib/sounds';
import { Compass, Leaf, Scissors, ShieldCheck, Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StoryStep {
  number: string;
  title: string;
  description: string;
  icon: any;
  subSpecs: string[];
  imageUrl: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    number: '01',
    title: 'RAW STREET BLUEPRINT',
    description: 'Our creative journey begins in the raw streets of Lahore. Our designers sculpt streetwear silhouettes that combine rigid structure, heavy-drop fits, and premium cyber aesthetics.',
    icon: Compass,
    subSpecs: ['Heavy Drop Shoulder', 'Technical Panel Cuts', '3D Box Silhouettes'],
    imageUrl: '/media/f37b90b7-timeline-blueprint.webp'
  },
  {
    number: '02',
    title: 'PAKISTANI ORGANIC COTTON',
    description: 'We source ultra-premium, heavy-weight organic cotton (up to 450 GSM) directly from sustainable fields across Pakistan, woven to deliver long-lasting softness and durable structural armor.',
    icon: Leaf,
    subSpecs: ['100% Organic Sourcing', '450 GSM Double-Fleece', 'Pakistan Cotton Pride'],
    imageUrl: '/media/4c222928-timeline-cotton.webp'
  },
  {
    number: '03',
    title: 'REINFORCED ARTISANAL STITCH',
    description: 'Every seam and detail is reinforced with heavy double-needle stitching by local Pakistani artisans. This gives our garments unmatched structural integrity that holds its shape wash after wash.',
    icon: Scissors,
    subSpecs: ['Double-Needle Flatlock', 'High-Density Bar-Tack', 'Artisanal Tailored Fit'],
    imageUrl: '/media/44648c12-timeline-stitch.webp'
  },
  {
    number: '04',
    title: 'ECO FUTURE DROP POD',
    description: 'Packaged in custom biodegradable metallic ziplock pods and delivered with zero carbon offsets. GrabNWear brings sustainable street drops directly to your doorstep.',
    icon: ShieldCheck,
    subSpecs: ['100% Biodegradable Poly', 'Custom Matte Metallic Pod', 'Express Green Shipping'],
    imageUrl: '/media/c80a6d31-timeline-pod.webp'
  }
];

/**
 * Preloads an image and returns a promise that resolves when the image is fully decoded.
 * Handles browser cache hits instantly.
 */
const useImagePreload = (src: string) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) { setLoaded(true); return; }
    const img = new Image();
    img.src = src;
    if (img.complete) {
      setLoaded(true);
    } else {
      img.onload = () => setLoaded(true);
      img.onerror = () => setLoaded(true); // Fail gracefully, don't block forever
    }
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return loaded;
};

/**
 * Optimized card wrapper that synchronizes IntersectionObserver visibility
 * with image preload state. The card only reveals once BOTH conditions are met,
 * eliminating empty-box pop-in artifacts completely.
 */
const CardWithObserver = ({ 
  children, 
  isLeft, 
  imageSrc 
}: { 
  children: React.ReactNode; 
  isLeft: boolean; 
  imageSrc?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const imageLoaded = useImagePreload(imageSrc || '');

  // The card is only "ready" when it's scrolled into view AND its image is loaded
  const ready = inView && imageLoaded;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full md:w-[45%]`}
      style={{
        opacity: ready ? 1 : 0,
        transform: ready
          ? 'translateY(0) translateX(0) scale(1)'
          : `translateY(28px) ${isLeft ? 'translateX(-12px)' : 'translateX(12px)'} scale(0.97)`,
        transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
};

export default function StoryTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Progress = how far the section has scrolled past the viewport, 0→1.
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const pct = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      sectionRef.current.style.setProperty('--scroll-pct', pct.toString());
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { handleScroll(); ticking = false; });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-14 md:py-24 overflow-hidden bg-background border-t border-border/40"
      id="brand-story"
      style={{ '--scroll-pct': '0' } as React.CSSProperties}
    >
      {/* Background Mesh Gradients - Layered CSS for rendering speed */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-15">
        <div className="absolute top-[20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-[60px] md:blur-[100px] dark:bg-primary/5" />
        <div className="absolute bottom-[30%] right-[-10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/10 rounded-full blur-[60px] md:blur-[100px] dark:bg-accent/5" />
      </div>

      <div className="container-page relative z-10 px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-24">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="h-[1px] w-8 bg-primary" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary">Brand Narrative</span>
            <span className="h-[1px] w-8 bg-primary" />
          </div>
          
          <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-4">
            Crafted for the Cyber-Age, <br />
            <span className="text-gradient">Rooted in Pakistan.</span>
          </h2>

          <p className="text-sm md:text-base text-muted-foreground">
            Trace the life-cycle of a GrabNWear garment—from organic thread harvesting to technical streetwear blueprinting.
          </p>
        </div>

        {/* Timeline Path & Cards Container */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* SVG TIMELINE DRAWING LINE */}
          {/* Desktop central curvy line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-24 -translate-x-1/2 pointer-events-none z-0">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 100 1400" 
              preserveAspectRatio="none"
            >
              {/* Background trace line */}
              <path
                d="M 50,0 C 95,150 5,350 50,550 C 95,750 5,950 50,1150 C 95,1300 50,1400 50,1400"
                fill="none"
                stroke="currentColor"
                className="text-border/40 dark:text-border/20"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              
              {/* Dynamic scroll-drawn glowing path driven by CSS variable */}
              <path
                d="M 50,0 C 95,150 5,350 50,550 C 95,750 5,950 50,1150 C 95,1300 50,1400 50,1400"
                fill="none"
                stroke="url(#neonGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ 
                  strokeDasharray: '1600',
                  strokeDashoffset: 'calc(1600 - (var(--scroll-pct, 0) * 1600))',
                  willChange: 'stroke-dashoffset'
                }}
              />

              {/* Glowing gradients definition */}
              <defs>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing tracer spark driven by CSS transform */}
            <div 
              className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 blur-[1px] shadow-[0_0_12px_#34d399] -translate-x-1/2"
              style={{
                left: '50%',
                top: 'calc(var(--scroll-pct, 0) * 100%)',
                transform: 'translateY(-50%) translateX(-50%)',
                willChange: 'top'
              }}
            />
          </div>

          {/* Mobile vertical straight line on left */}
          <div className="md:hidden absolute left-4 top-0 bottom-0 w-0.5 pointer-events-none z-0">
            <div className="w-full h-full bg-border/40 dark:bg-border/10" />
            {/* scaleY instead of animating height: compositor-only, no layout */}
            <div
              className="absolute inset-0 w-full bg-primary shadow-[0_0_8px_#7c3aed] origin-top"
              style={{
                transform: 'scaleY(var(--scroll-pct, 0))',
                willChange: 'transform',
              }}
            />
          </div>


          {/* STORY CARDS GRID */}
          <div className="space-y-10 md:space-y-0 md:relative w-full h-full">
            {STORY_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 0;

              return (
                <div 
                  key={step.number}
                  className={`flex flex-col md:flex-row relative z-10 w-full items-center justify-between gap-6 md:gap-0 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } ${idx > 0 ? 'md:pt-40' : ''}`}
                >
                  {/* Flanking Card Container - text card has NO image to preload */}
                  <CardWithObserver isLeft={isEven}>
                    {/* Glassmorphic Story Card */}
                    <div 
                      onMouseEnter={playPop}
                      className="group relative p-6 md:p-8 rounded-2xl border border-white/10 dark:border-white/5 bg-background/50 hover:bg-background/80 backdrop-blur-xl shadow-xl transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20 md:hover:-translate-y-1.5"
                    >
                      {/* Active floating step number */}
                      <span className={`absolute top-4 ${isEven ? 'left-4' : 'right-4'} md:static text-5xl md:text-6xl font-extrabold font-display leading-none text-muted-foreground/15 dark:text-muted-foreground/8 select-none tracking-tighter group-hover:text-primary/10 transition-colors`}>
                        {step.number}
                      </span>

                      {/* Header icon row */}
                      <div className={`flex items-center gap-3.5 mb-4 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-display text-lg md:text-xl font-bold tracking-tight">
                          {step.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className={`text-sm text-muted-foreground leading-relaxed mb-5 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                        {step.description}
                      </p>

                      {/* Technical tag pills */}
                      <div className={`flex flex-wrap gap-1.5 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                        {step.subSpecs.map(spec => (
                          <span 
                            key={spec}
                            className="text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full border border-border bg-background/60 font-semibold text-foreground/80 hover:border-primary/30 transition-all duration-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardWithObserver>

                  {/* Desktop Middle Point Tracer Node */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 pointer-events-none items-center justify-center z-20"
                    style={{
                      top: idx === 0 ? '40px' : '200px'
                    }}
                  >
                    <div className="w-8 h-8 rounded-full border-4 border-background bg-zinc-950 flex items-center justify-center hover:scale-125 transition-transform shadow-lg shadow-black/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>

                  {/* Flanking Image Card - synchronized with image preload */}
                  <CardWithObserver isLeft={!isEven} imageSrc={step.imageUrl}>
                    <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 dark:border-white/5 bg-secondary/30 shadow-2xl transition-all duration-500 hover:border-primary/20 md:hover:-translate-y-1.5">
                      <img 
                        src={step.imageUrl} 
                        alt={step.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                      
                      {/* Technical CAD overlay tag */}
                      <div className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-mono px-2 py-0.5 rounded border border-white/15 bg-black/75 text-emerald-400 backdrop-blur-md">
                        CAM_FEED_0{idx + 1}
                      </div>
                    </div>
                  </CardWithObserver>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Mission Callout Footer */}
        <div className="mt-28 md:mt-40 text-center glass-panel border border-white/10 dark:border-white/5 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-red-500/10 dark:text-red-500/5 select-none pointer-events-none">
            <Heart className="h-44 w-44 animate-pulse" />
          </div>
          
          <h3 className="font-display text-xl md:text-3xl font-extrabold tracking-tight mb-4 relative z-10">
            Empowering Pakistan's Craftsmanship, Redefining Streetwear.
          </h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-6 relative z-10 leading-relaxed">
            GrabNWear bridges the gap between high-end organic materials and local tailors in Pakistan, supporting ethical wages and local craftsmanship while creating the sturdiest apparel you will ever own.
          </p>
          <a href="/collections" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/10 transition-all duration-300 scale-95 hover:scale-100 relative z-10">
            Explore the Latest Drop
          </a>
        </div>
      </div>
    </section>
  );
}
