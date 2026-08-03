import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll detector tuned so content is already visible by the time it
 * reaches the viewport. We pre-trigger far below the fold (rootMargin) and
 * treat anything already on screen at mount as immediately visible, which
 * removes the "images pop in while scrolling" effect.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = '400px 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    // Already on (or near) screen at mount — skip the animation entirely.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400 && rect.bottom > -400) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
