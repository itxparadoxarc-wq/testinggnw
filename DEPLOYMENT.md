# Deploying this project

The app is **zero-config**: import the repo into any host (Vercel, Cloudflare
Pages/Workers, Netlify, Render, …), press deploy, and the storefront, auth,
cart, checkout, emails, AI features, and admin dashboard work immediately.

## One-click Vercel deploy

1. Vercel → Add New → Project → import this repository.
2. Leave every setting at its default and press **Deploy**.

`vercel.json` pins the build to `npm run build`, and the build detects
`VERCEL=1` and emits a Vercel Build Output API bundle (`.vercel/output`)
with SSR, server functions, and all static media. No environment variables
are required.

## Other hosts

- **Cloudflare Workers/Pages** – default target, `dist/` output.
- **Netlify** – detected via `NETLIFY`, uses the Netlify preset.
- Override anything with `NITRO_PRESET=<preset>`.

Build command: `npm run build` · Node 20+.

## Why no setup is needed

- All images/assets are committed under `public/media/`.
- Public backend config lives in the committed `.env` and is inlined into
  both the client and server bundles at build time. These are publishable
  values — row level security protects the data.

## Optional environment variables

| Variable | Enables |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin → Admin Accounts (create/delete admin users) |
| `RESEND_API_KEY` | Transactional emails (orders, status updates, contact form) |
| `GOOGLE_AI_API_KEY` | Admin AI assistant + AI product copy |
| `STRIPE_SECRET_KEY` | Card payments (COD / JazzCash / EasyPaisa work without it) |

Each of these degrades gracefully with a clear message when unset — nothing
else breaks.
