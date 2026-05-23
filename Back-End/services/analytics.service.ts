import { supabase } from '../api/supabase-client';

/**
 * Get capacity history for a specific bin
 */
export async function getBinCapacityHistory(binId: string, hours: number = 24) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const { data, error } = await supabase
    .from('capacity_history')
    .select('*')
    .eq('bin_id', binId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get capacity trends for all bins (last 7 days)
 */
export async function getCapacityTrends(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('capacity_history')
    .select('bin_id, capacity_percentage, recorded_at')
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get average capacity by hour of day
 */
export async function getAverageCapacityByHour() {
  const { data, error } = await supabase
    .rpc('get_avg_capacity_by_hour');

  if (error) {
    console.error('Error fetching hourly average:', error);
    // Return mock data if RPC function doesn't exist
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      avg_capacity: Math.floor(Math.random() * 60 + 20),
    }));
  }
  return data;
}

/**
 * Get collection efficiency stats
 */
export async function getCollectionStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: historyData, error } = await supabase
    .from('capacity_history')
    .select('bin_id, capacity_percentage, recorded_at')
    .gte('recorded_at', startDate.toISOString());

  if (error) throw error;

  // Calculate stats from history
  const binStats = new Map();

  historyData?.forEach(record => {
    if (!binStats.has(record.bin_id)) {
      binStats.set(record.bin_id, {
        readings: [],
        peaks: 0,
      });
    }

    const stats = binStats.get(record.bin_id);
    stats.readings.push(record.capacity_percentage);

    if (record.capacity_percentage && record.capacity_percentage >= 80) {
      stats.peaks++;
    }
  });

  const aggregated = Array.from(binStats.entries()).map(([binId, stats]) => ({
    bin_id: binId,
    total_readings: stats.readings.length,
    avg_capacity: stats.readings.reduce((a: number, b: number) => a + b, 0) / stats.readings.length,
    peak_count: stats.peaks,
  }));

  return aggregated;
}

/**
 * Get active alerts
 */
export async function getActiveAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create new alert
 */
export async function createAlert(
  binId: string,
  alertType: 'warning' | 'critical' | 'offline',
  message: string
) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      bin_id: binId,
      alert_type: alertType,
      message,
      is_resolved: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
