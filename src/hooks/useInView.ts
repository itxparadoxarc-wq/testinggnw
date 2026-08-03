import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll detector backed by a single shared IntersectionObserver.
 *
 * Using one observer for the whole page (instead of one per element) keeps
 * scrolling cheap, and the generous rootMargin means elements have already
 * finished their transition by the time they reach the viewport — no pop-in.
 */
const ROOT_MARGIN = '800px 0px';

type Cb = (visible: boolean) => void;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, Cb>();

function getObserver() {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cb = callbacks.get(entry.target);
          if (cb) cb(true);
          callbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: ROOT_MARGIN },
    );
  }
  return sharedObserver;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(_rootMargin?: string) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = getObserver();
    if (!observer) {
      setInView(true);
      return;
    }

    // Already on (or near) screen at mount — skip the animation entirely.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 600 && rect.bottom > -600) {
      setInView(true);
      return;
    }

    callbacks.set(node, () => setInView(true));
    observer.observe(node);
    return () => {
      callbacks.delete(node);
      observer.unobserve(node);
    };
  }, []);

  return { ref, inView };
}
