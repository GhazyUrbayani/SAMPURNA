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
      setBins((data as Bin[]) || []);
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

    const channel = supabase
      .channel(`trash_bins_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trash_bins' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBins(prev => [payload.new as Bin, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setBins(prev =>
              prev.map(bin => bin.id === (payload.new as Bin).id ? (payload.new as Bin) : bin)
            );
          } else if (payload.eventType === 'DELETE') {
            setBins(prev => prev.filter(bin => bin.id !== (payload.old as Bin).id));
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
