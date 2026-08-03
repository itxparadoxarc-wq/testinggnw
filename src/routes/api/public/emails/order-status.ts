import { createFileRoute } from '@tanstack/react-router';
import { button, escapeHtml, layout, orderItemsTable, sendEmail, totalsBlock } from '@/lib/email.server';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COPY: Record<string, { subject: (n: string) => string; title: string; body: string }> = {
  processing: {
    subject: (n) => `Order ${n} is being prepared`,
    title: 'Order in progress',
    body: "Good news — we've started preparing your order. We'll let you know the moment it ships.",
  },
  shipped: {
    subject: (n) => `Your order ${n} has shipped 🚚`,
    title: 'On its way',
    body: 'Your parcel is on the road. Delivery usually takes 2–5 working days across Pakistan.',
  },
  delivered: {
    subject: (n) => `Order ${n} delivered ✅`,
    title: 'Delivered',
    body: 'Your order has been delivered. We would love to hear what you think — reviews help us a lot!',
  },
  cancelled: {
    subject: (n) => `Order ${n} was cancelled`,
    title: 'Order cancelled',
    body: 'Your order has been cancelled. If a payment was made, the refund will be processed shortly.',
  },
  refunded: {
    subject: (n) => `Refund issued for order ${n}`,
    title: 'Refund issued',
    body: 'Your refund has been issued. Depending on your bank it can take 3–7 working days to appear.',
  },
};

export const Route = createFileRoute('/api/public/emails/order-status')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let payload: { order_id?: string; status?: string; tracking_number?: string };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
        }

        const { order_id: orderId, status, tracking_number: tracking } = payload;
        if (!orderId || !status) {
          return Response.json({ error: 'order_id and status are required' }, { status: 400, headers: cors });
        }

        const copy = COPY[status];
        if (!copy) return Response.json({ ok: true, skipped: 'no_template' }, { headers: cors });

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, order_number, email, subtotal, discount_amount, shipping_amount, total')
          .eq('id', orderId)
          .maybeSingle();

        if (!order?.email) {
          return Response.json({ ok: true, skipped: 'no_recipient' }, { headers: cors });
        }

        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('title, variant_title, quantity, total_price')
          .eq('order_id', orderId);

        const origin = new URL(request.url).origin;
        const html = layout(
          copy.title,
          `<p style="font-size:16px;margin:0 0 6px;">Hi there,</p>
           <p style="font-size:14px;color:#6b6675;line-height:1.7;margin:0 0 18px;">
             ${escapeHtml(copy.body)}<br>
             Order reference: <strong>${escapeHtml(order.order_number)}</strong>
             ${tracking ? `<br>Tracking number: <strong>${escapeHtml(tracking)}</strong>` : ''}
           </p>
           ${orderItemsTable(items ?? [])}
           ${totalsBlock(order as any)}
           <div style="margin-top:24px;">${button(`${origin}/orders`, 'Track my order')}</div>`,
          copy.subject(order.order_number),
        );

        const result = await sendEmail({ to: order.email, subject: copy.subject(order.order_number), html });
        return Response.json({ ok: true, result }, { headers: cors });
      },
    },
  },
});
