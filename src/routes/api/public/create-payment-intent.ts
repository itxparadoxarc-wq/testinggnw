// Stripe payment intent. Card payments stay disabled until a secret key is
// configured; the storefront's COD / JazzCash / EasyPaisa flows are unaffected.
import { createFileRoute } from '@tanstack/react-router';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const Route = createFileRoute('/api/public/create-payment-intent')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
          return Response.json(
            {
              error:
                'Card payments are not enabled yet. Please choose Cash on Delivery, JazzCash or EasyPaisa.',
            },
            { status: 400, headers: cors },
          );
        }

        let body: { amount?: number; currency?: string; email?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
        }

        const amount = Math.round(Number(body.amount || 0));
        if (!Number.isFinite(amount) || amount <= 0) {
          return Response.json({ error: 'Invalid amount' }, { status: 400, headers: cors });
        }

        const params = new URLSearchParams({
          amount: String(amount * 100),
          currency: (body.currency || 'pkr').toLowerCase(),
          'automatic_payment_methods[enabled]': 'true',
        });
        if (body.email) params.set('receipt_email', body.email);

        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });

        const data: any = await res.json();
        if (!res.ok) {
          return Response.json(
            { error: data?.error?.message || 'Payment initialization failed' },
            { status: 400, headers: cors },
          );
        }

        return Response.json({ clientSecret: data.client_secret }, { headers: cors });
      },
    },
  },
});
