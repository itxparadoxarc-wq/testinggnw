import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckoutSuccessPage = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get('order') || 'N/A';
  const whatsappUrl = params.get('whatsapp');

  return (
    <div className="container-page py-16 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6"
      >
        <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="font-display text-3xl mb-2">Thank you for your order!</h1>
        <p className="text-muted-foreground mb-6">
          Your order <span className="font-semibold text-foreground">{orderNumber}</span> has been confirmed.
        </p>

        <div className="bg-card rounded-lg border border-border p-6 mb-8 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium text-sm">Order Confirmed</p>
              <p className="text-xs text-muted-foreground">You'll receive updates on WhatsApp.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">What's Next?</p>
              <p className="text-xs text-muted-foreground">Your order will be processed and shipped within 1-3 business days.</p>
            </div>
          </div>
        </div>

        {whatsappUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 mb-3 font-medium">📱 Send your order details on WhatsApp</p>
            <p className="text-xs text-green-700 mb-3">Tap below to send your complete order summary (items, address, total) to us on WhatsApp for fast confirmation.</p>
            <Button
              onClick={() => window.open(whatsappUrl, '_blank')}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2 fill-white" />
              Send Order on WhatsApp
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild><Link to="/account/orders">View Orders</Link></Button>
          <Button variant="outline" asChild><Link to="/collections">Continue Shopping</Link></Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccessPage;
