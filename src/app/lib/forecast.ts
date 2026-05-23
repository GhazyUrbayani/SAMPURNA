import { supabase } from './supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast?: number;
  upper?: number;
  lower?: number;
}

interface HistoryRow {
  bin_id: string;
  capacity_percentage: number;
  recorded_at: string;
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0, stderr: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const meanY = sumY / n;
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const stderr = Math.sqrt(ssRes / Math.max(n - 2, 1));
  return { slope, intercept, r2, stderr };
}

function dayKey(iso: string) {
  return iso.split('T')[0];
}

function toIsoDay(d: Date) {
  return d.toISOString().split('T')[0];
}

export interface ForecastResult {
  series: ForecastPoint[];
  slope: number;
  r2: number;
  hoursToFull: number | null;
  trend: 'rising' | 'stable' | 'falling';
}

export async function buildForecast(daysHistory = 30, daysForecast = 7): Promise<ForecastResult> {
  const since = new Date();
  since.setDate(since.getDate() - daysHistory);

  const { data, error } = await supabase
    .from('capacity_history')
    .select('bin_id, capacity_percentage, recorded_at')
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as HistoryRow[];

  const byDay = new Map<string, number[]>();
  rows.forEach(r => {
    const key = dayKey(r.recorded_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r.capacity_percentage);
  });

  const dailyAvg = Array.from(byDay.entries())
    .map(([date, vals]) => ({ date, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (dailyAvg.length === 0) {
    return { series: [], slope: 0, r2: 0, hoursToFull: null, trend: 'stable' };
  }

  const baseDate = new Date(dailyAvg[0].date + 'T00:00:00Z');
  const points = dailyAvg.map(d => ({
    x: (new Date(d.date + 'T00:00:00Z').getTime() - baseDate.getTime()) / 86400000,
    y: d.avg,
  }));

  const { slope, intercept, r2, stderr } = linearRegression(points);

  const seenDates = new Set<string>();
  const series: ForecastPoint[] = [];
  dailyAvg.forEach(d => {
    if (seenDates.has(d.date)) return;
    seenDates.add(d.date);
    series.push({
      date: d.date,
      actual: Math.round(d.avg * 10) / 10,
    });
  });

  const lastX = points[points.length - 1].x;
  const lastDate = new Date(dailyAvg[dailyAvg.length - 1].date + 'T00:00:00Z');
  for (let i = 1; i <= daysForecast; i++) {
    const x = lastX + i;
    const yhat = slope * x + intercept;
    const clamped = Math.min(100, Math.max(0, yhat));
    const ci = 1.96 * stderr;
    const next = new Date(lastDate);
    next.setUTCDate(next.getUTCDate() + i);
    const upper = Math.min(100, Math.round((clamped + ci) * 10) / 10);
    const lower = Math.max(0, Math.round((clamped - ci) * 10) / 10);
    const dateStr = toIsoDay(next);
    if (seenDates.has(dateStr)) continue;
    seenDates.add(dateStr);
    series.push({
      date: dateStr,
      forecast: Math.round(clamped * 10) / 10,
      upper,
      lower,
    });
  }

  const currentAvg = dailyAvg[dailyAvg.length - 1].avg;
  let hoursToFull: number | null = null;
  if (slope > 0.05) {
    const daysToFull = (100 - currentAvg) / slope;
    if (daysToFull > 0 && daysToFull < 90) hoursToFull = Math.round(daysToFull * 24);
  }

  const trend: ForecastResult['trend'] =
    slope > 0.3 ? 'rising' : slope < -0.3 ? 'falling' : 'stable';

  return { series, slope, r2, hoursToFull, trend };
}

export async function seedHistoricalData(daysBack = 30, readingsPerDay = 4): Promise<{ inserted: number; bins: number }> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-8403692b/seed-history`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ daysBack, readingsPerDay }),
  });

  let payload: { inserted?: number; bins?: number; error?: string } = {};
  try { payload = await res.json(); } catch {}

  if (!res.ok) {
    const detail = payload.error ?? `${res.status} ${res.statusText}`;
    throw new Error(detail);
  }
  return { inserted: payload.inserted ?? 0, bins: payload.bins ?? 0 };
}
