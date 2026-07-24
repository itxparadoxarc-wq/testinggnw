import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Star,
  FileText, Settings, Truck, Layers, FolderTree, Newspaper, LogOut, Store, Menu, X, CreditCard
} from 'lucide-react';
import AdminAIChat from '@/components/admin/AdminAIChat';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Categories', icon: FolderTree, path: '/admin/categories' },
  { label: 'Collections', icon: Layers, path: '/admin/collections' },
  { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Customers', icon: Users, path: '/admin/customers' },
  { label: 'Discounts', icon: Tag, path: '/admin/discounts' },
  { label: 'Inventory', icon: Package, path: '/admin/inventory' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'Blog', icon: Newspaper, path: '/admin/blog' },
  { label: 'Pages', icon: FileText, path: '/admin/pages' },
  { label: 'Shipping', icon: Truck, path: '/admin/shipping' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminLayout = () => {
  const { signOut, profile, loading, isAdmin } = useAuth();
  const { settings } = useStoreSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-muted-foreground">You don't have admin privileges.</p>
        <Link to="/" className="text-primary hover:underline">Go to Store</Link>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <img
            src="/__l5e/assets-v1/672ef6d3-4ff0-4905-aadf-53cdbfa2f036/logo.webp"
            alt={settings.store_name}
            className="h-7"
          />
          <span className="font-display text-lg text-sidebar-primary">{settings.store_name}</span>
        </Link>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">Admin Dashboard</p>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
              }`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
          <Store className="h-4 w-4" /> View Store
        </Link>
        <button onClick={() => signOut()} className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground w-full">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 hidden lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col animate-slide-in-right" style={{ animationName: 'slideInLeft' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 justify-between bg-background sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-secondary rounded-lg transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name || 'Admin'}</p>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant */}
      <AdminAIChat />
    </div>
  );
};

export default AdminLayout;
