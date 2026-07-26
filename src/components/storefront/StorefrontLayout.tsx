import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';
import CartDrawer from './CartDrawer';
import ThemeToggle from './ThemeToggle';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const StorefrontLayout = () => {
  const { settings } = useStoreSettings();
  const location = useLocation();

  // Apply theme settings as CSS custom properties in real-time
  useEffect(() => {
    const root = document.documentElement;
    const t = settings.theme;

    if (t.primary_color) {
      root.style.setProperty('--primary', t.primary_color);
      root.style.setProperty('--accent', t.primary_color);
      root.style.setProperty('--ring', t.primary_color);
    }

    if (t.border_radius) {
      root.style.setProperty('--radius', t.border_radius);
    }

    if (t.font_display) {
      root.style.setProperty('--font-display', `'${t.font_display}', serif`);
      loadFont(t.font_display);
    }
    if (t.font_body) {
      root.style.setProperty('--font-body', `'${t.font_body}', sans-serif`);
      loadFont(t.font_body);
    }
  }, [settings.theme]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-background text-foreground">
      <StorefrontHeader />
      <main className="flex-1 relative">
        <Outlet />
      </main>
      <StorefrontFooter />
      <CartDrawer />
      <ThemeToggle />
    </div>
  );
};

function loadFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export default StorefrontLayout;
