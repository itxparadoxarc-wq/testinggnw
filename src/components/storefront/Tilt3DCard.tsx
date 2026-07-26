import { useRef, ReactNode, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
  glareEnabled?: boolean;
  scale?: number;
}

/**
 * Lightweight pointer tilt.
 *
 * The previous version drove four framer-motion springs per card, which meant
 * a rAF loop per spring per card (10+ cards on the home page) plus React
 * re-renders on hover. This writes transforms straight to the DOM inside a
 * single rAF, so hovering a grid of cards costs one style write per frame.
 */
const Tilt3DCard = ({
  children,
  className = '',
  tiltIntensity = 12,
  scale = 1.02,
}: Tilt3DCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ rx: 0, ry: 0, s: 1 });
  const isMobile = useIsMobile();

  const apply = useCallback(() => {
    frameRef.current = null;
    const el = ref.current;
    if (!el) return;
    const { rx, ry, s } = targetRef.current;
    el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s})`;
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(apply);
  }, [apply]);

  const handleMouseEnter = () => {
    if (isMobile || !ref.current) return;
    rectRef.current = ref.current.getBoundingClientRect();
    ref.current.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
    ref.current.style.willChange = 'transform';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = rectRef.current ?? ref.current?.getBoundingClientRect();
    if (!rect) return;
    rectRef.current = rect;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    targetRef.current = {
      rx: (0.5 - py) * 2 * tiltIntensity,
      ry: (px - 0.5) * 2 * tiltIntensity,
      s: scale,
    };
    schedule();
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    targetRef.current = { rx: 0, ry: 0, s: 1 };
    rectRef.current = null;
    schedule();
    if (ref.current) ref.current.style.willChange = 'auto';
  };

  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </div>
  );
};

export default Tilt3DCard;
