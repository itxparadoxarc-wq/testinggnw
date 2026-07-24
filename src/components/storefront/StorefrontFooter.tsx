import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const StorefrontFooter = () => {
  const { settings } = useStoreSettings();
  const pm = settings.payment_methods;

  const enabledPayments = [
    pm.cod && 'COD',
    pm.stripe && 'Visa',
    pm.stripe && 'Mastercard',
    pm.jazzcash && 'JazzCash',
    pm.easypaisa && 'EasyPaisa',
  ].filter(Boolean);

  return (
    <footer className="bg-foreground text-background/80 mt-16">
      <div className="container-page py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <img
                src="/__l5e/assets-v1/672ef6d3-4ff0-4905-aadf-53cdbfa2f036/logo.webp"
                alt={settings.store_name}
                className="h-10"
              />
              <span className="font-display text-xl font-bold text-background">{settings.store_name}</span>
            </Link>
            <p className="text-sm leading-relaxed opacity-70">
              {settings.footer.tagline}
            </p>
            <div className="flex gap-3 mt-5">
              {settings.social_links.facebook && (
                <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.social_links.instagram && (
                <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {/* WhatsApp removed from footer */}
              {!settings.social_links.facebook && !settings.social_links.instagram && (
                <>
                  <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"><Facebook className="h-4 w-4" /></a>
                  <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"><Instagram className="h-4 w-4" /></a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-background/60">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'All Collections', to: '/collections' },
                { label: 'New Arrivals', to: '/collections/new-arrivals' },
                { label: 'Best Sellers', to: '/collections/best-sellers' },
                { label: 'Sale', to: '/collections/on-sale' },
                { label: 'Blog', to: '/blog' },
              ].map(link => (
                <li key={link.to}><Link to={link.to} className="hover:text-background transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-background/60">Support</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'About Us', to: '/pages/about' },
                { label: 'Contact', to: '/contact' },
                { label: 'FAQ', to: '/pages/faq' },
                { label: 'Shipping Policy', to: '/pages/shipping-policy' },
                { label: 'Returns', to: '/pages/return-policy' },
                { label: 'Privacy Policy', to: '/pages/privacy-policy' },
                { label: 'Terms of Service', to: '/pages/terms' },
              ].map(link => (
                <li key={link.to}><Link to={link.to} className="hover:text-background transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-background/60">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 opacity-60" />
                <span>{settings.store_email || 'hello@grabnwear.com'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 opacity-60" />
                <span>{settings.store_phone || '+92 318 7166226'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 opacity-60 mt-0.5" />
                <span>{settings.store_location || 'Lahore, Punjab, Pakistan'}</span>
              </div>
            </div>
            {enabledPayments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-background/10">
                <p className="text-xs opacity-50 mb-2">We Accept</p>
                <div className="flex gap-3 flex-wrap items-center">
                  {pm.cod && <img src="/__l5e/assets-v1/0c8414fb-15e4-49d0-835a-3e185843e440/payment-cod.png" alt="COD" className="h-8 w-auto object-contain" />}
                  {pm.stripe && <span className="px-2 py-1 bg-background/10 rounded text-[10px] font-semibold">Visa/MC</span>}
                  {pm.jazzcash && <img src="/__l5e/assets-v1/87908764-5adb-4d14-988d-dec005844eb7/payment-jazzcash.png" alt="JazzCash" className="h-8 w-auto object-contain" />}
                  {pm.easypaisa && <img src="/__l5e/assets-v1/e7e406c5-5c12-46aa-866f-773f7dec3fd1/payment-easypaisa.png" alt="EasyPaisa" className="h-8 w-auto object-contain" />}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-8 text-center text-sm opacity-50">
          <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default StorefrontFooter;
