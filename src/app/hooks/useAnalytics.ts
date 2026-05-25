import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TrendPoint {
  date: string;
  avg_capacity: number;
}

export interface ZoneData {
  zone: string;
  avg_capacity: number;
}

export interface StatusDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface Alert {
  id: string;
  bin_id: string;
  alert_type: 'warning' | 'critical' | 'offline' | null;
  message: string | null;
  created_at: string | null;
  is_resolved: boolean | null;
}

export interface AnalyticsSummary {
  totalBins: number;
  avgCapacity: number;
  criticalCount: number;
  activeAlertCount: number;
  mostActiveZone: string;
  mostActiveZoneAvg: number;
}

export function useAnalytics() {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [zoneData, setZoneData] = useState<ZoneData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistributionItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalBins: 0,
    avgCapacity: 0,
    criticalCount: 0,
    activeAlertCount: 0,
    mostActiveZone: '-',
    mostActiveZoneAvg: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch capacity history for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [historyResult, binsResult, alertsResult] = await Promise.all([
        supabase
          .from('capacity_history')
          .select('bin_id, capacity_percentage, recorded_at')
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true }),
        supabase
          .from('trash_bins')
          .select('bin_id, location, capacity_percentage, status'),
        supabase
          .from('alerts')
          .select('*')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Process 7-day trends from capacity_history
      if (historyResult.data && historyResult.data.length > 0) {
        const byDay = new Map<string, number[]>();
        historyResult.data.forEach(record => {
          if (record.recorded_at) {
            const day = record.recorded_at.split('T')[0];
            if (!byDay.has(day)) byDay.set(day, []);
            byDay.get(day)!.push(record.capacity_percentage ?? 0);
          }
        });

        const trendPoints: TrendPoint[] = Array.from(byDay.entries()).map(([date, values]) => ({
          date,
          avg_capacity: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        }));
        setTrends(trendPoints);
      }

      // Process bin status distribution and zone data
      if (binsResult.data && binsResult.data.length > 0) {
        const bins = binsResult.data;
        const totalBins = bins.length;
        const totalCap = bins.reduce((sum, b) => sum + (b.capacity_percentage ?? 0), 0);
        const avgCapacity = Math.round(totalCap / totalBins);

        const normalCount = bins.filter(b => b.status === 'normal').length;
        const warningCount = bins.filter(b => b.status === 'warning').length;
        const criticalCount = bins.filter(b => b.status === 'critical').length;
        const offlineCount = bins.filter(b => b.status === 'offline').length;

        const distribution: StatusDistributionItem[] = [
          { name: 'Normal', value: normalCount, color: '#10b981' },
          { name: 'Warning', value: warningCount, color: '#eab308' },
          { name: 'Critical', value: criticalCount, color: '#ef4444' },
        ];
        if (offlineCount > 0) {
          distribution.push({ name: 'Offline', value: offlineCount, color: '#6b7280' });
        }
        setStatusDistribution(distribution.filter(d => d.value > 0));

        // Zone comparison - group by first part of location before ' - '
        const byZone = new Map<string, number[]>();
        bins.forEach(bin => {
          const zone = (bin.location ?? 'Unknown').split(' - ')[0].trim() || 'Unknown';
          if (!byZone.has(zone)) byZone.set(zone, []);
          byZone.get(zone)!.push(bin.capacity_percentage ?? 0);
        });

        const zones: ZoneData[] = Array.from(byZone.entries()).map(([zone, caps]) => ({
          zone,
          avg_capacity: Math.round(caps.reduce((a, b) => a + b, 0) / caps.length),
        })).sort((a, b) => b.avg_capacity - a.avg_capacity);

        setZoneData(zones);

        const topZone = zones[0];
        setSummary({
          totalBins,
          avgCapacity,
          criticalCount,
          activeAlertCount: alertsResult.data?.length ?? 0,
          mostActiveZone: topZone?.zone ?? '-',
          mostActiveZoneAvg: topZone?.avg_capacity ?? 0,
        });
      }

      setAlerts((alertsResult.data as Alert[]) || []);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    trends,
    zoneData,
    statusDistribution,
    alerts,
    summary,
    loading,
    refetch: loadAnalytics,
  };
}
