// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { readFileSync } from "node:fs";

// Read the committed .env at build time so public backend config is baked into the
// server bundle. This keeps deploys portable (Cloudflare, Vercel, Netlify, …) without
// requiring the user to configure env vars by hand. Only public values are inlined.
function envFromDotenv(key: string): string {
  if (process.env[key]) return process.env[key] as string;
  try {
    const file = readFileSync(new URL("./.env", import.meta.url), "utf8");
    const line = file.split("\n").find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

const SUPABASE_URL = envFromDotenv("VITE_SUPABASE_URL") || envFromDotenv("SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY =
  envFromDotenv("VITE_SUPABASE_PUBLISHABLE_KEY") || envFromDotenv("SUPABASE_PUBLISHABLE_KEY");

// Pick the deploy target automatically from the host's own environment so a plain
// "import repo -> deploy" works with no manual configuration:
//   Vercel  -> VERCEL=1            -> vercel preset (.vercel/output)
//   Netlify -> NETLIFY=true        -> netlify preset
//   otherwise (Cloudflare, local)  -> cloudflare module worker
function detectPreset(): string {
  if (process.env.NITRO_PRESET) return process.env.NITRO_PRESET;
  if (process.env.VERCEL) return "vercel";
  if (process.env.NETLIFY) return "netlify";
  return "cloudflare-module";
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: detectPreset(),
  },
  vite: {
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    },
  },
});

