import { supabase } from '../api/supabase-client';
import type { Database } from '../types/database.types';

type TrashBin = Database['public']['Tables']['trash_bins']['Row'];
type TrashBinInsert = Database['public']['Tables']['trash_bins']['Insert'];
type TrashBinUpdate = Database['public']['Tables']['trash_bins']['Update'];

/**
 * Fetch all trash bins
 */
export async function getAllBins() {
  const { data, error } = await supabase
    .from('trash_bins')
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get single bin by ID
 */
export async function getBinById(binId: string) {
  const { data, error } = await supabase
    .from('trash_bins')
    .select('*')
    .eq('bin_id', binId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get bins by status
 */
export async function getBinsByStatus(status: 'normal' | 'warning' | 'critical' | 'offline') {
  const { data, error } = await supabase
    .from('trash_bins')
    .select('*')
    .eq('status', status)
    .order('capacity_percentage', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update bin capacity and status
 */
export async function updateBinCapacity(binId: string, capacityPercentage: number) {
  let status: 'normal' | 'warning' | 'critical';

  if (capacityPercentage >= 80) {
    status = 'critical';
  } else if (capacityPercentage >= 50) {
    status = 'warning';
  } else {
    status = 'normal';
  }

  const { data, error } = await supabase
    .from('trash_bins')
    .update({
      capacity_percentage: capacityPercentage,
      status,
      last_updated: new Date().toISOString(),
    })
    .eq('bin_id', binId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  await supabase
    .from('capacity_history')
    .insert({
      bin_id: binId,
      capacity_percentage: capacityPercentage,
      recorded_at: new Date().toISOString(),
    });

  return data;
}

/**
 * Create new bin
 */
export async function createBin(bin: TrashBinInsert) {
  const { data, error } = await supabase
    .from('trash_bins')
    .insert(bin)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete bin
 */
export async function deleteBin(binId: string) {
  const { error } = await supabase
    .from('trash_bins')
    .delete()
    .eq('bin_id', binId);

  if (error) throw error;
  return true;
}

/**
 * Subscribe to real-time bin updates
 */
export function subscribeToBinUpdates(callback: (bin: TrashBin) => void) {
  return supabase
    .channel('trash_bins_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trash_bins',
      },
      (payload) => {
        callback(payload.new as TrashBin);
      }
    )
    .subscribe();
}
