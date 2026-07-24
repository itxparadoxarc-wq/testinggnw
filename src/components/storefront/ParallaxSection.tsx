import { useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
}

const ParallaxSection = ({
  children,
  className = '',
  speed = 0.3,
  direction = 'up',
}: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const multiplier = direction === 'up' ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed * multiplier, -100 * speed * multiplier]);

  if (shouldReduce || isMobile) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div style={{ transform: 'translateY(0)', willChange: 'transform' }}>
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;
