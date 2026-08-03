// Client-side helpers for triggering transactional email through the app's
// server routes. Fire-and-forget: email failures must never break a checkout.

async function post(path: string, body: unknown) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[email] request failed', path, res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] request error', path, err);
    return false;
  }
}

export function sendOrderConfirmationEmail(orderId: string) {
  return post('/api/public/emails/order-confirmation', { order_id: orderId });
}

export function sendOrderStatusEmail(orderId: string, status: string, trackingNumber?: string | null) {
  return post('/api/public/emails/order-status', {
    order_id: orderId,
    status,
    tracking_number: trackingNumber || undefined,
  });
}

export function sendContactEmail(input: { name: string; email: string; subject?: string; message: string }) {
  return post('/api/public/emails/contact', { ...input, type: 'contact' });
}

export function sendNewsletterWelcomeEmail(email: string) {
  return post('/api/public/emails/contact', { email, type: 'newsletter' });
}
