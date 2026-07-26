import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthInit } from "@/contexts/AuthContext";
import { CartSync } from "@/contexts/CartContext";
import { WishlistSync } from "@/contexts/WishlistContext";

import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Eager load critical pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";

// Lazy load non-critical pages
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const CollectionsPage = lazy(() => import("@/pages/storefront/CollectionsPage"));
const ProductDetailPage = lazy(() => import("@/pages/storefront/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/storefront/CartPage"));
const SearchPage = lazy(() => import("@/pages/storefront/SearchPage"));
const WishlistPage = lazy(() => import("@/pages/storefront/WishlistPage"));
const AccountPage = lazy(() => import("@/pages/storefront/AccountPage"));
const OrdersPage = lazy(() => import("@/pages/storefront/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/storefront/OrderDetailPage"));
const BlogPage = lazy(() => import("@/pages/storefront/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/storefront/BlogPostPage"));
const StaticPage = lazy(() => import("@/pages/storefront/StaticPage"));
const ContactPage = lazy(() => import("@/pages/storefront/ContactPage"));
const CheckoutPage = lazy(() => import("@/pages/storefront/CheckoutPage"));
const CheckoutSuccessPage = lazy(() => import("@/pages/storefront/CheckoutSuccessPage"));
const AddressesPage = lazy(() => import("@/pages/storefront/AddressesPage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminCollections = lazy(() => import("@/pages/admin/AdminCollections"));
const AdminCustomers = lazy(() => import("@/pages/admin/AdminCustomers"));
const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
const AdminInventory = lazy(() => import("@/pages/admin/AdminInventory"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminBlog = lazy(() => import("@/pages/admin/AdminBlog"));
const AdminPages = lazy(() => import("@/pages/admin/AdminPages"));
const AdminShipping = lazy(() => import("@/pages/admin/AdminShipping"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminTeam = lazy(() => import("@/pages/admin/AdminTeam"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min cache
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthInit />
        <CartSync />
        <WishlistSync />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Storefront */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:slug" element={<CollectionsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/pages/:slug" element={<StaticPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/account/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/account/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/account/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
              <Route path="/account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            </Route>

            {/* Admin - Protected */}
            <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/team" element={<AdminTeam />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/collections" element={<AdminCollections />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/shipping" element={<AdminShipping />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
