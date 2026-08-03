// Server-only email helper built on Resend.
// All transactional email for the storefront + admin flows through here.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const STORE_NAME = 'GrabnWear';

function fromAddress() {
  // Uses a verified sender domain when configured, otherwise Resend's shared
  // onboarding sender (which only delivers to the Resend account owner).
  return process.env.EMAIL_FROM || `${STORE_NAME} <onboarding@resend.dev>`;
}

export function adminNotifyAddress(): string | null {
  return process.env.ADMIN_EMAIL || 'basitk7003@gmail.com';
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing — skipping send:', subject);
    return { sent: false, reason: 'missing_api_key' as const };
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[email] Resend error', res.status, text);
    return { sent: false, reason: 'provider_error' as const, status: res.status, detail: text };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { sent: true as const, id: data.id };
}

/* ---------------------------------- theme --------------------------------- */

const BRAND = '#6b21a8';
const INK = '#1a1420';
const MUTED = '#6b6675';

export function layout(title: string, body: string, preheader = '') {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
  <tr><td style="background:${BRAND};padding:24px 28px;">
    <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px;">${STORE_NAME}</div>
    <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:2px;">${escapeHtml(title)}</div>
  </td></tr>
  <tr><td style="padding:28px;">${body}</td></tr>
  <tr><td style="padding:20px 28px;border-top:1px solid #eee;color:${MUTED};font-size:12px;line-height:1.6;">
    You're receiving this email because of activity on your ${STORE_NAME} account or order.<br>
    &copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function escapeHtml(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function money(n: number) {
  return `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>`;
}

export interface OrderEmailItem {
  title: string;
  variant_title?: string | null;
  quantity: number;
  total_price: number;
  image_url?: string | null;
}

export function orderItemsTable(items: OrderEmailItem[]) {
  const rows = items
    .map(
      (i) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0eef3;font-size:14px;">
        <strong>${escapeHtml(i.title)}</strong>${i.variant_title ? `<br><span style="color:${MUTED};font-size:12px;">${escapeHtml(i.variant_title)}</span>` : ''}
        <br><span style="color:${MUTED};font-size:12px;">Qty ${i.quantity}</span>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #f0eef3;font-size:14px;white-space:nowrap;">${money(i.total_price)}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

export function totalsBlock(o: {
  subtotal: number;
  discount_amount?: number | null;
  shipping_amount?: number | null;
  total: number;
}) {
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;font-size:${bold ? 15 : 13}px;${bold ? 'font-weight:700;' : `color:${MUTED};`}">${label}</td>
     <td align="right" style="padding:4px 0;font-size:${bold ? 15 : 13}px;${bold ? 'font-weight:700;' : ''}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
    ${line('Subtotal', money(o.subtotal))}
    ${o.discount_amount ? line('Discount', `-${money(o.discount_amount)}`) : ''}
    ${line('Shipping', o.shipping_amount ? money(o.shipping_amount) : 'Free')}
    ${line('Total', money(o.total), true)}
  </table>`;
}

export function addressBlock(a: Record<string, any> | null | undefined) {
  if (!a) return '';
  const parts = [
    `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
    a.address_line_1,
    a.address_line_2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(', '),
    a.country,
    a.phone,
  ].filter(Boolean);
  return `<div style="margin-top:18px;padding:14px 16px;background:#faf9fb;border-radius:12px;font-size:13px;line-height:1.7;color:${INK};">
    <div style="font-weight:700;margin-bottom:4px;">Delivery address</div>
    ${parts.map((p) => escapeHtml(p)).join('<br>')}
  </div>`;
}
