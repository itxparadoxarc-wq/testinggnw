import { createFileRoute } from '@tanstack/react-router';
import {
  addressBlock,
  adminNotifyAddress,
  button,
  escapeHtml,
  layout,
  money,
  orderItemsTable,
  sendEmail,
  totalsBlock,
} from '@/lib/email.server';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const Route = createFileRoute('/api/public/emails/order-confirmation')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let payload: { order_id?: string };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
        }
        const orderId = payload.order_id;
        if (!orderId || typeof orderId !== 'string') {
          return Response.json({ error: 'order_id is required' }, { status: 400, headers: cors });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { data: order, error } = await supabaseAdmin
          .from('orders')
          .select(
            'id, order_number, email, subtotal, discount_amount, shipping_amount, total, status, payment_status, notes, shipping_address_json, created_at',
          )
          .eq('id', orderId)
          .maybeSingle();

        if (error || !order) {
          return Response.json({ error: 'Order not found' }, { status: 404, headers: cors });
        }

        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('title, variant_title, quantity, total_price, image_url')
          .eq('order_id', orderId);

        const origin = new URL(request.url).origin;
        const orderUrl = `${origin}/orders`;
        const list = orderItemsTable(items ?? []);

        const customerHtml = layout(
          `Order ${order.order_number} confirmed`,
          `<p style="font-size:16px;margin:0 0 6px;">Thank you for your order! 🎉</p>
           <p style="font-size:14px;color:#6b6675;margin:0 0 18px;line-height:1.7;">
             We've received order <strong>${escapeHtml(order.order_number)}</strong> and our team is preparing it now.
             You'll get another email as soon as it ships.
           </p>
           ${list}
           ${totalsBlock(order as any)}
           ${addressBlock(order.shipping_address_json as any)}
           <div style="margin-top:24px;">${button(orderUrl, 'View my orders')}</div>`,
          `Order ${order.order_number} — ${money(order.total)}`,
        );

        const results: Record<string, unknown> = {};
        if (order.email) {
          results.customer = await sendEmail({
            to: order.email,
            subject: `Order ${order.order_number} confirmed — thank you!`,
            html: customerHtml,
          });
        }

        const admin = adminNotifyAddress();
        if (admin) {
          const adminHtml = layout(
            `New order ${order.order_number}`,
            `<p style="font-size:16px;margin:0 0 6px;">New order received 🛒</p>
             <p style="font-size:14px;color:#6b6675;margin:0 0 18px;">
               From ${escapeHtml(order.email || 'guest')} · ${escapeHtml(order.notes || 'no notes')}
             </p>
             ${list}
             ${totalsBlock(order as any)}
             ${addressBlock(order.shipping_address_json as any)}
             <div style="margin-top:24px;">${button(`${origin}/admin/orders`, 'Open in admin')}</div>`,
            `${order.order_number} · ${money(order.total)}`,
          );
          results.admin = await sendEmail({
            to: admin,
            subject: `🛒 New order ${order.order_number} — ${money(order.total)}`,
            html: adminHtml,
            replyTo: order.email || undefined,
          });
        }

        return Response.json({ ok: true, results }, { headers: cors });
      },
    },
  },
});
