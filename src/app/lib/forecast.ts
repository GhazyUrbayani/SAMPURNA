import ARIMA from 'arima';
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

export interface ForecastResult {
  series: ForecastPoint[];
  slope: number;
  r2: number;
  hoursToFull: number | null;
  trend: 'rising' | 'stable' | 'falling';
  model: 'ARIMA' | 'AutoARIMA' | 'LinearRegression';
}

function dayKey(iso: string) {
  return iso.split('T')[0];
}

function toIsoDay(d: Date) {
  return d.toISOString().split('T')[0];
}

function linearFallback(points: { x: number; y: number }[]) {
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

function computeR2(actual: number[], fitted: number[]): number {
  if (actual.length === 0) return 0;
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < actual.length; i++) {
    ssTot += (actual[i] - mean) ** 2;
    ssRes += (actual[i] - fitted[i]) ** 2;
  }
  return ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
}

function runArima(series: number[], steps: number): {
  forecast: number[];
  errors: number[];
  fitted: number[];
  modelName: 'ARIMA' | 'AutoARIMA';
} | null {
  try {
    // AutoARIMA picks (p,d,q) via small grid search — best for general time series.
    const auto = new ARIMA({ auto: true, approximation: 1, search: 0 } as any).fit(series);
    const [forecast, errors] = auto.predict(steps);
    // In-sample fitted values for R² calculation.
    const [fitted] = auto.predict(0) as unknown as [number[], number[]];
    auto.destroy?.();
    return {
      forecast: Array.from(forecast),
      errors: Array.from(errors),
      fitted: Array.isArray(fitted) && fitted.length === series.length ? Array.from(fitted) : series,
      modelName: 'AutoARIMA',
    };
  } catch {
    try {
      // Fallback to fixed ARIMA(1,1,1) — robust default for noisy daily metrics.
      const model = new ARIMA({ p: 1, d: 1, q: 1, verbose: false } as any).fit(series);
      const [forecast, errors] = model.predict(steps);
      model.destroy?.();
      return {
        forecast: Array.from(forecast),
        errors: Array.from(errors),
        fitted: series,
        modelName: 'ARIMA',
      };
    } catch {
      return null;
    }
  }
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
    return { series: [], slope: 0, r2: 0, hoursToFull: null, trend: 'stable', model: 'LinearRegression' };
  }

  const yValues = dailyAvg.map(d => d.avg);
  const lastDate = new Date(dailyAvg[dailyAvg.length - 1].date + 'T00:00:00Z');

  const seenDates = new Set<string>();
  const series: ForecastPoint[] = [];
  dailyAvg.forEach(d => {
    if (seenDates.has(d.date)) return;
    seenDates.add(d.date);
    series.push({ date: d.date, actual: Math.round(d.avg * 10) / 10 });
  });

  let slope = 0;
  let r2 = 0;
  let modelName: ForecastResult['model'] = 'LinearRegression';
  let forecastValues: number[] = [];
  let errorValues: number[] = [];

  // ARIMA needs a minimum of ~10 points to fit a useful model. Below that, fall back.
  const arimaResult = yValues.length >= 10 ? runArima(yValues, daysForecast) : null;

  if (arimaResult) {
    forecastValues = arimaResult.forecast;
    errorValues = arimaResult.errors;
    modelName = arimaResult.modelName;
    r2 = computeR2(yValues, arimaResult.fitted);
    // Slope = average %/day change across the forecast horizon.
    const first = yValues[yValues.length - 1];
    const last = forecastValues[forecastValues.length - 1] ?? first;
    slope = (last - first) / Math.max(forecastValues.length, 1);
  } else {
    const points = yValues.map((y, i) => ({ x: i, y }));
    const fit = linearFallback(points);
    slope = fit.slope;
    const fitted = points.map(p => fit.slope * p.x + fit.intercept);
    r2 = computeR2(yValues, fitted);
    const lastX = points[points.length - 1].x;
    forecastValues = Array.from({ length: daysForecast }, (_, i) => fit.slope * (lastX + i + 1) + fit.intercept);
    errorValues = Array.from({ length: daysForecast }, () => fit.stderr);
    modelName = 'LinearRegression';
  }

  for (let i = 0; i < daysForecast; i++) {
    const next = new Date(lastDate);
    next.setUTCDate(next.getUTCDate() + i + 1);
    const dateStr = toIsoDay(next);
    if (seenDates.has(dateStr)) continue;
    seenDates.add(dateStr);

    const yhat = Math.min(100, Math.max(0, forecastValues[i] ?? 0));
    const ci = 1.96 * (errorValues[i] ?? 0);
    series.push({
      date: dateStr,
      forecast: Math.round(yhat * 10) / 10,
      upper: Math.min(100, Math.round((yhat + ci) * 10) / 10),
      lower: Math.max(0, Math.round((yhat - ci) * 10) / 10),
    });
  }

  const currentAvg = yValues[yValues.length - 1];
  let hoursToFull: number | null = null;
  // Walk the forecast trajectory looking for the first crossing of 100%.
  for (let i = 0; i < forecastValues.length; i++) {
    if ((forecastValues[i] ?? 0) >= 100) {
      hoursToFull = (i + 1) * 24;
      break;
    }
  }
  if (hoursToFull == null && slope > 0.05) {
    const daysToFull = (100 - currentAvg) / slope;
    if (daysToFull > 0 && daysToFull < 90) hoursToFull = Math.round(daysToFull * 24);
  }

  const trend: ForecastResult['trend'] =
    slope > 0.3 ? 'rising' : slope < -0.3 ? 'falling' : 'stable';

  return { series, slope, r2, hoursToFull, trend, model: modelName };
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
