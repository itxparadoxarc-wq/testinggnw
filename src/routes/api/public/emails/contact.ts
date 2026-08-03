import { createFileRoute } from '@tanstack/react-router';
import { adminNotifyAddress, escapeHtml, layout, sendEmail } from '@/lib/email.server';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const Route = createFileRoute('/api/public/emails/contact')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let payload: { name?: string; email?: string; subject?: string; message?: string; type?: string };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
        }

        const name = (payload.name || '').trim().slice(0, 120);
        const email = (payload.email || '').trim().slice(0, 200);
        const subject = (payload.subject || '').trim().slice(0, 200);
        const message = (payload.message || '').trim().slice(0, 5000);
        const type = payload.type === 'newsletter' ? 'newsletter' : 'contact';

        if (!EMAIL_RE.test(email)) {
          return Response.json({ error: 'A valid email is required' }, { status: 400, headers: cors });
        }
        if (type === 'contact' && !message) {
          return Response.json({ error: 'Message is required' }, { status: 400, headers: cors });
        }

        const admin = adminNotifyAddress();
        const results: Record<string, unknown> = {};

        if (type === 'newsletter') {
          if (admin) {
            results.admin = await sendEmail({
              to: admin,
              subject: `📬 New newsletter subscriber — ${email}`,
              html: layout('New subscriber', `<p style="font-size:14px;">${escapeHtml(email)} joined the newsletter.</p>`),
            });
          }
          results.customer = await sendEmail({
            to: email,
            subject: 'Welcome to the GrabnWear list ✨',
            html: layout(
              'Subscription confirmed',
              `<p style="font-size:16px;margin:0 0 6px;">You're on the list!</p>
               <p style="font-size:14px;color:#6b6675;line-height:1.7;">
                 Expect early access to drops, private discounts and styling notes — no spam, ever.
               </p>`,
              'Welcome to GrabnWear',
            ),
          });
          return Response.json({ ok: true, results }, { headers: cors });
        }

        if (admin) {
          results.admin = await sendEmail({
            to: admin,
            subject: `✉️ Contact form: ${subject || 'New message'}`,
            replyTo: email,
            html: layout(
              'New contact message',
              `<p style="font-size:14px;line-height:1.8;">
                 <strong>From:</strong> ${escapeHtml(name || 'Anonymous')} (${escapeHtml(email)})<br>
                 <strong>Subject:</strong> ${escapeHtml(subject || '—')}
               </p>
               <div style="margin-top:12px;padding:14px 16px;background:#faf9fb;border-radius:12px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>`,
              subject || 'New contact message',
            ),
          });
        }

        results.customer = await sendEmail({
          to: email,
          subject: "We received your message — GrabnWear",
          html: layout(
            'Message received',
            `<p style="font-size:16px;margin:0 0 6px;">Thanks for reaching out${name ? `, ${escapeHtml(name)}` : ''}!</p>
             <p style="font-size:14px;color:#6b6675;line-height:1.7;">
               Our team replies within 24 hours (Mon–Sat, 10am–8pm PKT). Here's a copy of what you sent:
             </p>
             <div style="margin-top:12px;padding:14px 16px;background:#faf9fb;border-radius:12px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>`,
            'We received your message',
          ),
        });

        return Response.json({ ok: true, results }, { headers: cors });
      },
    },
  },
});
