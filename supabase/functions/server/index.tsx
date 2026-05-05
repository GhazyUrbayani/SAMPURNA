import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const PREFIX = "/make-server-010e5093";

// ============================================================
// Helpers
// ============================================================
async function requireAuth(c: any) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return { error: "Missing access token", user: null };
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(
    accessToken,
  );
  if (error || !user) {
    console.log(`Auth failure on ${c.req.path}: ${error?.message ?? "no user"}`);
    return { error: error?.message ?? "Unauthorized", user: null };
  }
  return { error: null, user };
}

function computeStatus(fullness: number): "critical" | "warning" | "normal" {
  if (fullness > 80) return "critical";
  if (fullness >= 50) return "warning";
  return "normal";
}

// ============================================================
// Health
// ============================================================
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// ============================================================
// Auth
// ============================================================
app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name ?? email.split("@")[0], role: "operator" },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name: name ?? email.split("@")[0],
      role: "operator",
      createdAt: new Date().toISOString(),
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup exception: ${error}`);
    return c.json({ error: `Internal server error during signup: ${error}` }, 500);
  }
});

app.get(`${PREFIX}/me`, async (c) => {
  const { error, user } = await requireAuth(c);
  if (error) return c.json({ error: `Unauthorized: ${error}` }, 401);
  const profile = await kv.get(`user:${user.id}`);
  return c.json({ user, profile: profile ?? null });
});

// ============================================================
// Trash Bins
// ============================================================
app.get(`${PREFIX}/bins`, async (c) => {
  try {
    const bins = await kv.getByPrefix("bin:");
    return c.json({ bins });
  } catch (error) {
    console.log(`Error fetching bins: ${error}`);
    return c.json({ error: `Failed to fetch bins: ${error}` }, 500);
  }
});

app.get(`${PREFIX}/bins/:id`, async (c) => {
  try {
    const bin = await kv.get(`bin:${c.req.param("id")}`);
    if (!bin) return c.json({ error: "Bin not found" }, 404);
    return c.json({ bin });
  } catch (error) {
    console.log(`Error fetching bin: ${error}`);
    return c.json({ error: `Failed to fetch bin: ${error}` }, 500);
  }
});

app.post(`${PREFIX}/bins`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const body = await c.req.json();
    const id = body.id || `bin-${Date.now()}`;
    const fullness = Number(body.fullness ?? 0);
    const bin = {
      id,
      name: body.name ?? "Unnamed Bin",
      location: body.location ?? "Unknown",
      fullness,
      status: computeStatus(fullness),
      deviceId: body.deviceId ?? "",
      lastUpdated: new Date().toISOString(),
      createdAt: body.createdAt ?? new Date().toISOString(),
    };
    await kv.set(`bin:${id}`, bin);
    return c.json({ success: true, bin });
  } catch (error) {
    console.log(`Error creating bin: ${error}`);
    return c.json({ error: `Failed to create bin: ${error}` }, 500);
  }
});

app.put(`${PREFIX}/bins/:id`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`bin:${id}`);
    if (!existing) return c.json({ error: "Bin not found" }, 404);

    const updates = await c.req.json();
    const merged = { ...existing, ...updates, id, lastUpdated: new Date().toISOString() };
    if (updates.fullness !== undefined) merged.status = computeStatus(Number(updates.fullness));
    await kv.set(`bin:${id}`, merged);
    return c.json({ success: true, bin: merged });
  } catch (error) {
    console.log(`Error updating bin: ${error}`);
    return c.json({ error: `Failed to update bin: ${error}` }, 500);
  }
});

app.delete(`${PREFIX}/bins/:id`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);
    await kv.del(`bin:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting bin: ${error}`);
    return c.json({ error: `Failed to delete bin: ${error}` }, 500);
  }
});

// ============================================================
// IoT Devices
// ============================================================
app.get(`${PREFIX}/devices`, async (c) => {
  try {
    const devices = await kv.getByPrefix("device:");
    return c.json({ devices });
  } catch (error) {
    console.log(`Error fetching devices: ${error}`);
    return c.json({ error: `Failed to fetch devices: ${error}` }, 500);
  }
});

app.get(`${PREFIX}/devices/:id`, async (c) => {
  try {
    const device = await kv.get(`device:${c.req.param("id")}`);
    if (!device) return c.json({ error: "Device not found" }, 404);
    return c.json({ device });
  } catch (error) {
    return c.json({ error: `Failed to fetch device: ${error}` }, 500);
  }
});

app.post(`${PREFIX}/devices`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const body = await c.req.json();
    const id = body.id || `device-${Date.now()}`;
    const device = {
      id,
      deviceId: body.deviceId ?? id,
      location: body.location ?? "Unknown",
      batteryLevel: Number(body.batteryLevel ?? 100),
      networkStatus: body.networkStatus ?? "online",
      thresholdLimit: Number(body.thresholdLimit ?? 80),
      firmwareVersion: body.firmwareVersion ?? "1.0.0",
      lastPing: new Date().toISOString(),
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`device:${id}`, device);
    return c.json({ success: true, device });
  } catch (error) {
    console.log(`Error creating device: ${error}`);
    return c.json({ error: `Failed to create device: ${error}` }, 500);
  }
});

app.put(`${PREFIX}/devices/:id`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`device:${id}`);
    if (!existing) return c.json({ error: "Device not found" }, 404);

    const updates = await c.req.json();
    const merged = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await kv.set(`device:${id}`, merged);
    return c.json({ success: true, device: merged });
  } catch (error) {
    console.log(`Error updating device: ${error}`);
    return c.json({ error: `Failed to update device: ${error}` }, 500);
  }
});

app.delete(`${PREFIX}/devices/:id`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);
    await kv.del(`device:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: `Failed to delete device: ${error}` }, 500);
  }
});

// Device control actions (test, reboot, firmware)
app.post(`${PREFIX}/devices/:id/action`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const id = c.req.param("id");
    const { action, payload } = await c.req.json();
    const existing = await kv.get(`device:${id}`);
    if (!existing) return c.json({ error: "Device not found" }, 404);

    const now = new Date().toISOString();
    let result: Record<string, unknown> = { action, deviceId: id, at: now };

    switch (action) {
      case "test":
        result = { ...result, ok: existing.networkStatus === "online", latencyMs: 42 };
        break;
      case "reboot":
        await kv.set(`device:${id}`, { ...existing, lastPing: now, updatedAt: now });
        result = { ...result, ok: true, message: "Reboot command queued" };
        break;
      case "firmware-update": {
        const newVersion = payload?.version ?? "1.0.1";
        await kv.set(`device:${id}`, {
          ...existing,
          firmwareVersion: newVersion,
          updatedAt: now,
        });
        result = { ...result, ok: true, firmwareVersion: newVersion };
        break;
      }
      default:
        return c.json({ error: `Unknown action: ${action}` }, 400);
    }

    await kv.set(`device-log:${id}:${Date.now()}`, result);
    return c.json({ success: true, result });
  } catch (error) {
    console.log(`Device action error: ${error}`);
    return c.json({ error: `Device action failed: ${error}` }, 500);
  }
});

// ============================================================
// Telemetry ingestion (from ESP32 sensor)
// ============================================================
app.post(`${PREFIX}/telemetry`, async (c) => {
  try {
    const body = await c.req.json();
    const { deviceId, fullness, batteryLevel, networkStatus } = body;
    if (!deviceId) return c.json({ error: "deviceId is required" }, 400);

    const now = new Date().toISOString();
    const ts = Date.now();

    // Update device snapshot
    const devices = await kv.getByPrefix("device:");
    const device = devices.find((d: any) => d.deviceId === deviceId);
    if (device) {
      await kv.set(`device:${device.id}`, {
        ...device,
        batteryLevel: batteryLevel ?? device.batteryLevel,
        networkStatus: networkStatus ?? "online",
        lastPing: now,
        updatedAt: now,
      });
    }

    // Update bin fullness
    if (fullness !== undefined) {
      const bins = await kv.getByPrefix("bin:");
      const bin = bins.find((b: any) => b.deviceId === deviceId);
      if (bin) {
        const status = computeStatus(Number(fullness));
        await kv.set(`bin:${bin.id}`, {
          ...bin,
          fullness: Number(fullness),
          status,
          lastUpdated: now,
        });

        // Generate alert if critical
        if (status === "critical") {
          const alertId = `alert:${ts}`;
          await kv.set(alertId, {
            id: alertId,
            type: "critical",
            binId: bin.id,
            binName: bin.name,
            location: bin.location,
            fullness: Number(fullness),
            message: `${bin.name} mencapai ${fullness}% (kritis)`,
            read: false,
            createdAt: now,
          });
        }
      }
    }

    // Persist telemetry log
    await kv.set(`telemetry:${deviceId}:${ts}`, { ...body, receivedAt: now });
    return c.json({ success: true });
  } catch (error) {
    console.log(`Telemetry error: ${error}`);
    return c.json({ error: `Telemetry ingestion failed: ${error}` }, 500);
  }
});

app.get(`${PREFIX}/telemetry/:deviceId`, async (c) => {
  try {
    const deviceId = c.req.param("deviceId");
    const items = await kv.getByPrefix(`telemetry:${deviceId}:`);
    return c.json({ telemetry: items });
  } catch (error) {
    return c.json({ error: `Failed to fetch telemetry: ${error}` }, 500);
  }
});

// ============================================================
// Alerts / Notifications
// ============================================================
app.get(`${PREFIX}/alerts`, async (c) => {
  try {
    const alerts = await kv.getByPrefix("alert:");
    alerts.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));
    return c.json({ alerts });
  } catch (error) {
    return c.json({ error: `Failed to fetch alerts: ${error}` }, 500);
  }
});

app.patch(`${PREFIX}/alerts/:id/read`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(id.startsWith("alert:") ? id : `alert:${id}`);
    if (!existing) return c.json({ error: "Alert not found" }, 404);
    await kv.set(existing.id, { ...existing, read: true });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: `Failed to update alert: ${error}` }, 500);
  }
});

app.delete(`${PREFIX}/alerts/:id`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);
    const id = c.req.param("id");
    await kv.del(id.startsWith("alert:") ? id : `alert:${id}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: `Failed to delete alert: ${error}` }, 500);
  }
});

// ============================================================
// Dashboard stats
// ============================================================
app.get(`${PREFIX}/dashboard/stats`, async (c) => {
  try {
    const [bins, devices, alerts] = await Promise.all([
      kv.getByPrefix("bin:"),
      kv.getByPrefix("device:"),
      kv.getByPrefix("alert:"),
    ]);

    const total = bins.length;
    const critical = bins.filter((b: any) => b.status === "critical").length;
    const warning = bins.filter((b: any) => b.status === "warning").length;
    const normal = bins.filter((b: any) => b.status === "normal").length;
    const avgFullness = total
      ? Math.round(bins.reduce((s: number, b: any) => s + Number(b.fullness ?? 0), 0) / total)
      : 0;
    const onlineDevices = devices.filter((d: any) => d.networkStatus === "online").length;
    const unreadAlerts = alerts.filter((a: any) => !a.read).length;

    return c.json({
      stats: {
        totalBins: total,
        criticalBins: critical,
        warningBins: warning,
        normalBins: normal,
        avgFullness,
        totalDevices: devices.length,
        onlineDevices,
        offlineDevices: devices.length - onlineDevices,
        unreadAlerts,
      },
    });
  } catch (error) {
    console.log(`Dashboard stats error: ${error}`);
    return c.json({ error: `Failed to compute stats: ${error}` }, 500);
  }
});

// ============================================================
// Analytics
// ============================================================
app.get(`${PREFIX}/analytics`, async (c) => {
  try {
    const [history, zones, latest] = await Promise.all([
      kv.get("analytics:history"),
      kv.get("analytics:zones"),
      kv.get("analytics:latest"),
    ]);
    return c.json({
      history: history ?? [],
      zones: zones ?? [],
      latest: latest ?? {},
    });
  } catch (error) {
    return c.json({ error: `Failed to fetch analytics: ${error}` }, 500);
  }
});

app.post(`${PREFIX}/analytics`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const { history, zones, ...latest } = await c.req.json();
    const now = new Date().toISOString();
    if (history) await kv.set("analytics:history", history);
    if (zones) await kv.set("analytics:zones", zones);
    await kv.set("analytics:latest", { ...latest, updatedAt: now });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: `Failed to save analytics: ${error}` }, 500);
  }
});

// ============================================================
// Seed: bootstrap mock data (idempotent)
// ============================================================
app.post(`${PREFIX}/seed`, async (c) => {
  try {
    const { error: authErr } = await requireAuth(c);
    if (authErr) return c.json({ error: `Unauthorized: ${authErr}` }, 401);

    const existing = await kv.getByPrefix("bin:");
    if (existing.length > 0) {
      return c.json({ success: true, skipped: true, reason: "Data already present" });
    }

    const now = new Date().toISOString();
    const bins = [
      { id: "1", name: "Labtek V - Floor 1", location: "Labtek V Building", fullness: 85, deviceId: "ESP32-001" },
      { id: "2", name: "Labtek V - Lobby", location: "Labtek V Building", fullness: 45, deviceId: "ESP32-002" },
      { id: "3", name: "Labtek VIII - Floor 2", location: "Labtek VIII Building", fullness: 65, deviceId: "ESP32-003" },
      { id: "4", name: "Labtek VIII - Cafeteria", location: "Labtek VIII Building", fullness: 92, deviceId: "ESP32-004" },
      { id: "5", name: "Library - Main Hall", location: "Central Library", fullness: 38, deviceId: "ESP32-005" },
      { id: "6", name: "Library - Reading Room", location: "Central Library", fullness: 55, deviceId: "ESP32-006" },
      { id: "7", name: "Student Center - East Wing", location: "Student Center", fullness: 78, deviceId: "ESP32-007" },
      { id: "8", name: "Student Center - Food Court", location: "Student Center", fullness: 22, deviceId: "ESP32-008" },
    ];

    const devices = [
      { id: "1", deviceId: "ESP32-001", location: "Labtek V - Floor 1", batteryLevel: 78, networkStatus: "online" },
      { id: "2", deviceId: "ESP32-002", location: "Labtek V - Lobby", batteryLevel: 92, networkStatus: "online" },
      { id: "3", deviceId: "ESP32-003", location: "Labtek VIII - Floor 2", batteryLevel: 65, networkStatus: "online" },
      { id: "4", deviceId: "ESP32-004", location: "Labtek VIII - Cafeteria", batteryLevel: 45, networkStatus: "online" },
      { id: "5", deviceId: "ESP32-005", location: "Library - Main Hall", batteryLevel: 88, networkStatus: "online" },
      { id: "6", deviceId: "ESP32-006", location: "Library - Reading Room", batteryLevel: 15, networkStatus: "offline" },
      { id: "7", deviceId: "ESP32-007", location: "Student Center - East Wing", batteryLevel: 72, networkStatus: "online" },
      { id: "8", deviceId: "ESP32-008", location: "Student Center - Food Court", batteryLevel: 95, networkStatus: "online" },
    ];

    const binEntries = bins.map((b) => [
      `bin:${b.id}`,
      { ...b, status: computeStatus(b.fullness), lastUpdated: now, createdAt: now },
    ]) as [string, any][];

    const deviceEntries = devices.map((d) => [
      `device:${d.id}`,
      {
        ...d,
        thresholdLimit: 80,
        firmwareVersion: "1.0.0",
        lastPing: now,
        createdAt: now,
        updatedAt: now,
      },
    ]) as [string, any][];

    await kv.mset([...binEntries, ...deviceEntries]);

    await kv.set("analytics:history", [
      { date: "2026-04-29", volume: 245 },
      { date: "2026-04-30", volume: 278 },
      { date: "2026-05-01", volume: 312 },
      { date: "2026-05-02", volume: 289 },
      { date: "2026-05-03", volume: 356 },
      { date: "2026-05-04", volume: 398 },
      { date: "2026-05-05", volume: 425 },
    ]);
    await kv.set("analytics:zones", [
      { zone: "Labtek V", volume: 156 },
      { zone: "Labtek VIII", volume: 203 },
      { zone: "Library", volume: 98 },
      { zone: "Student Center", volume: 187 },
    ]);

    return c.json({ success: true, bins: bins.length, devices: devices.length });
  } catch (error) {
    console.log(`Seed error: ${error}`);
    return c.json({ error: `Failed to seed: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
