# Deploying this project

The app is designed to be **zero-config**: clone/import the repo into any host
(Cloudflare Pages/Workers, Vercel, Netlify, Render, …), run the build, and the
storefront, auth, cart, checkout, and admin dashboard work immediately.

## Why no setup is needed

- All images/assets are committed under `public/media/`, so nothing depends on a
  Lovable preview domain.
- Public backend config lives in the committed `.env`
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
  plus their non-`VITE_` server twins). These are publishable values that are
  safe in a repo — row level security protects the data.
- `vite.config.ts` reads that `.env` at build time and inlines
  `process.env.SUPABASE_URL` / `process.env.SUPABASE_PUBLISHABLE_KEY` into the
  server bundle, so SSR and server functions work even when the host injects no
  environment variables at all.

## Build settings

- Build command: `npm run build`
- Output: handled by the framework preset (Cloudflare Workers by default)
- Node: 20+

## Optional: admin account management

The only feature that needs a platform secret is **Admin → Admin Accounts**
(creating/deleting admin users), because it calls the privileged Auth Admin API.
A service-role key must never be committed to a public repo, so set it as a
secret on your host if you want that page to work:

```
SUPABASE_SERVICE_ROLE_KEY = <your service role key>
```

Without it, everything else — including signing in as an existing admin and
managing products, orders, collections, blog, and settings — works normally, and
that one page shows a clear message instead of failing silently.
