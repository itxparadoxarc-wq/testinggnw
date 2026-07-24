import { useRef, ReactNode, useState } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
  glareEnabled?: boolean;
  scale?: number;
}

const Tilt3DCard = ({
  children,
  className = '',
  tiltIntensity = 12,
  glareEnabled = true,
  scale = 1.02,
}: Tilt3DCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const shouldReduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(x, [0, 1], [-tiltIntensity, tiltIntensity]);

  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20, mass: 0.5 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20, mass: 0.5 });
  const springScale = useSpring(1, { stiffness: 150, damping: 20 });
  const springGlareOpacity = useSpring(0, { stiffness: 150, damping: 20 });

  const glareX = useTransform(x, [0, 1], [0, 100]);
  const glareY = useTransform(y, [0, 1], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;

  const handleMouseEnter = () => {
    if (shouldReduce || isMobile) return;
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
    springScale.set(scale);
    springGlareOpacity.set(1);
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduce || isMobile) return;
    let rect = rectRef.current;
    if (!rect) {
      if (ref.current) {
        rect = ref.current.getBoundingClientRect();
        rectRef.current = rect;
      } else {
        return;
      }
    }
    const newX = (e.clientX - rect.left) / rect.width;
    const newY = (e.clientY - rect.top) / rect.height;
    x.set(newX);
    y.set(newY);
  };

  const handleMouseLeave = () => {
    if (shouldReduce || isMobile) return;
    x.set(0.5);
    y.set(0.5);
    springScale.set(1);
    springGlareOpacity.set(0);
    rectRef.current = null;
    setIsHovered(false);
  };

  if (shouldReduce || isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: springScale,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {children}
      {glareEnabled && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
          style={{
            background: glareBackground,
            opacity: springGlareOpacity,
          }}
        />
      )}
    </motion.div>
  );
};

export default Tilt3DCard;
