import { ReactNode, forwardRef, useRef, useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

const offsets: Record<NonNullable<ScrollRevealProps['direction']>, string> = {
  up: 'translate3d(0, 18px, 0)',
  down: 'translate3d(0, -18px, 0)',
  left: 'translate3d(18px, 0, 0)',
  right: 'translate3d(-18px, 0, 0)',
  none: 'none',
};

export const ScrollReveal = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 450,
}: ScrollRevealProps) => {
  const shouldReduce = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : offsets[direction],
        willChange: inView ? undefined : 'opacity, transform',
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};


export const StaggerContainer = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; staggerDelay?: number }
>(({ children, className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };


  // Children always render: gating them on `visible` left an empty box in the
  // layout until the observer fired, which caused visible content jumps / CLS.
  // Each StaggerItem handles its own reveal transition.
  return (
    <div ref={setRefs} className={className}>
      {children}
    </div>
  );
});

StaggerContainer.displayName = 'StaggerContainer';

export const StaggerItem = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => {
  const { ref: itemRef, inView } = useInView<HTMLDivElement>();

  const setRefs = (node: HTMLDivElement | null) => {
    (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={setRefs}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translate3d(0, 14px, 0)',
        transition: 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
});
StaggerItem.displayName = 'StaggerItem';

