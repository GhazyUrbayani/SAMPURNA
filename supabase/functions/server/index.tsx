import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

app.get("/make-server-8403692b/health", (c) => c.json({ status: "ok" }));

app.get("/make-server-8403692b/manifest.json", (c) => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><rect width="192" height="192" rx="34" fill="#2c5f6f"/><rect x="64" y="56" width="64" height="8" rx="2" fill="white"/><path d="M56 72 L136 72 L128 152 Q128 160 120 160 L72 160 Q64 160 64 152 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/><line x1="80" y1="88" x2="80" y2="148" stroke="white" stroke-width="6" stroke-linecap="round"/><line x1="112" y1="88" x2="112" y2="148" stroke="white" stroke-width="6" stroke-linecap="round"/></svg>`;
  const iconDataUri = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
  const manifest = {
    id: "/sampurna-app",
    name: "SAMPURNA — Smart Waste Monitoring",
    short_name: "SAMPURNA",
    description: "IoT-based waste bin monitoring and analytics dashboard for smart city sanitation management",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#2c5f6f",
    categories: ["productivity", "utilities"],
    lang: "id",
    dir: "ltr",
    icons: [
      { src: iconDataUri, sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: iconDataUri, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
    ],
  };
  return c.json(manifest, 200, { "Content-Type": "application/manifest+json" });
});

app.post("/make-server-8403692b/seed-history", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const daysBack = Math.min(Math.max(Number(body.daysBack) || 30, 1), 90);
    const readingsPerDay = Math.min(Math.max(Number(body.readingsPerDay) || 4, 1), 24);

    const sb = supabaseAdmin();
    const { data: bins, error: binsErr } = await sb.from("trash_bins").select("bin_id");
    if (binsErr) {
      console.log("Seed: failed to fetch bins:", binsErr.message);
      return c.json({ error: `Failed to fetch bins: ${binsErr.message}` }, 500);
    }
    if (!bins || bins.length === 0) {
      return c.json({ error: "No trash bins found. Add bins first." }, 400);
    }

    const rows: { bin_id: string; capacity_percentage: number; recorded_at: string }[] = [];
    const now = Date.now();

    bins.forEach((bin: { bin_id: string }, binIdx: number) => {
      const phase = (binIdx * 1.3) % (Math.PI * 2);
      const baseFillRate = 2 + Math.random() * 3;
      let currentFill = 10 + Math.random() * 30;
      for (let day = daysBack; day >= 0; day--) {
        for (let r = 0; r < readingsPerDay; r++) {
          const hoursOffset = day * 24 + (24 - r * (24 / readingsPerDay));
          const ts = new Date(now - hoursOffset * 3600 * 1000);
          const hour = ts.getUTCHours();
          const diurnal = Math.sin(((hour + phase) / 24) * Math.PI * 2) * 8;
          const weekly = ts.getUTCDay() === 0 || ts.getUTCDay() === 6 ? -5 : 3;
          const noise = (Math.random() - 0.5) * 6;
          currentFill += baseFillRate / readingsPerDay + diurnal * 0.05 + weekly * 0.05 + noise * 0.3;
          if (currentFill >= 90 && Math.random() < 0.3) currentFill = 5 + Math.random() * 15;
          currentFill = Math.max(0, Math.min(100, currentFill));
          rows.push({
            bin_id: bin.bin_id,
            capacity_percentage: Math.round(currentFill),
            recorded_at: ts.toISOString(),
          });
        }
      }
    });

    let inserted = 0;
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error: insertErr } = await sb.from("capacity_history").insert(chunk);
      if (insertErr) {
        console.log("Seed: insert chunk failed:", insertErr.message);
        return c.json({
          error: `Insert failed at row ${inserted}: ${insertErr.message}`,
          inserted,
        }, 500);
      }
      inserted += chunk.length;
    }

    return c.json({ inserted, bins: bins.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("Seed: unexpected error:", msg);
    return c.json({ error: `Unexpected error during seed: ${msg}` }, 500);
  }
});

Deno.serve(app.fetch);
