import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type BinStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface Bin {
  id: string;
  bin_id: string;
  location: string;
  capacity_percentage: number;
  status: BinStatus;
  last_updated: string | null;
  device_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

const ALLOWED_STATUS: BinStatus[] = ['normal', 'warning', 'critical', 'offline'];

function normalizeBin(row: any): Bin {
  const rawCap = row?.capacity_percentage;
  const cap = typeof rawCap === 'number' ? rawCap : Number(rawCap);
  const safeCap = Number.isFinite(cap) ? Math.max(0, Math.min(100, cap)) : 0;
  const status: BinStatus = ALLOWED_STATUS.includes(row?.status)
    ? row.status
    : safeCap > 80 ? 'critical' : safeCap >= 50 ? 'warning' : 'normal';
  return {
    id: String(row?.id ?? ''),
    bin_id: String(row?.bin_id ?? ''),
    location: typeof row?.location === 'string' && row.location ? row.location : 'Unknown',
    capacity_percentage: safeCap,
    status,
    last_updated: row?.last_updated ?? null,
    device_id: row?.device_id ?? null,
    latitude: typeof row?.latitude === 'number' ? row.latitude : null,
    longitude: typeof row?.longitude === 'number' ? row.longitude : null,
  };
}

export function useBins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBins = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('trash_bins')
        .select('*')
        .order('last_updated', { ascending: false });

      if (fetchError) throw fetchError;
      setBins(((data as any[]) || []).map(normalizeBin));
    } catch (err: unknown) {
      console.error('Failed to load bins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bins');
    } finally {
      setLoading(false);
    }
  };

  const markAsEmptied = async (binId: string) => {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('trash_bins')
      .update({
        capacity_percentage: 0,
        status: 'normal',
        last_updated: now,
      })
      .eq('bin_id', binId);

    if (updateError) throw updateError;

    await supabase.from('capacity_history').insert({
      bin_id: binId,
      capacity_percentage: 0,
      recorded_at: now,
    });

    setBins(prev =>
      prev.map(bin =>
        bin.bin_id === binId
          ? { ...bin, capacity_percentage: 0, status: 'normal', last_updated: now }
          : bin
      )
    );
  };

  useEffect(() => {
    loadBins();

    const normalize = normalizeBin;

    const channel = supabase
      .channel(`trash_bins_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trash_bins' },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const incoming = normalize(payload.new);
              setBins(prev => prev.some(b => b.id === incoming.id) ? prev : [incoming, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const incoming = normalize(payload.new);
              setBins(prev => prev.map(bin => bin.id === incoming.id ? incoming : bin));
            } else if (payload.eventType === 'DELETE') {
              const oldId = String((payload.old as any)?.id ?? '');
              setBins(prev => prev.filter(bin => bin.id !== oldId));
            }
          } catch (e) {
            console.error('Realtime payload handling failed:', e, payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { bins, loading, error, markAsEmptied, refetch: loadBins };
}
