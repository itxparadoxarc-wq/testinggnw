import { useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yRange?: number;
  rotateRange?: number;
}

const FloatingElement = ({
  children,
  className = '',
  duration = 4,
  delay = 0,
}: FloatingElementProps) => {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <div
      className={className}
      style={{
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      {children}
    </div>
  );
};

export default FloatingElement;
