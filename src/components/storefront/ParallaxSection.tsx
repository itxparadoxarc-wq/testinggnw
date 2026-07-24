import { ReactNode } from 'react';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
}

// Lightweight pass-through: the previous implementation used useScroll/useTransform
// but never applied the resulting motion value, so it only added scroll listeners
// and layout thrash. Keep the API to avoid touching every caller.
const ParallaxSection = ({ children, className = '' }: ParallaxSectionProps) => {
  return <div className={className}>{children}</div>;
};

export default ParallaxSection;
