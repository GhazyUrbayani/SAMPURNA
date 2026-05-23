import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Device {
  id: string;
  device_id: string;
  location: string;
  battery_level: number;
  network_status: 'online' | 'offline';
  threshold_limit: number;
  firmware_version: string | null;
  ip_address: string | null;
  last_ping: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type DeviceInsert = {
  device_id: string;
  location: string;
  threshold_limit?: number;
  battery_level?: number;
  network_status?: 'online' | 'offline';
};

export type DeviceUpdate = Partial<Omit<Device, 'id' | 'created_at'>>;

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('iot_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDevices((data as Device[]) || []);
    } catch (err: unknown) {
      console.error('Failed to load devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async (deviceData: DeviceInsert): Promise<Device> => {
    const { data, error: insertError } = await supabase
      .from('iot_devices')
      .insert({
        ...deviceData,
        battery_level: deviceData.battery_level ?? 100,
        network_status: deviceData.network_status ?? 'online',
        threshold_limit: deviceData.threshold_limit ?? 80,
        last_ping: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;
    const newDevice = data as Device;
    setDevices(prev => [newDevice, ...prev]);
    return newDevice;
  };

  const updateDevice = async (deviceId: string, updates: DeviceUpdate): Promise<Device> => {
    const { data, error: updateError } = await supabase
      .from('iot_devices')
      .update(updates)
      .eq('device_id', deviceId)
      .select()
      .single();

    if (updateError) throw updateError;
    const updated = data as Device;
    setDevices(prev => prev.map(d => d.device_id === deviceId ? updated : d));
    return updated;
  };

  const deleteDevice = async (deviceId: string) => {
    const { error: deleteError } = await supabase
      .from('iot_devices')
      .delete()
      .eq('device_id', deviceId);

    if (deleteError) throw deleteError;
    setDevices(prev => prev.filter(d => d.device_id !== deviceId));
  };

  const rebootDevice = async (deviceId: string) => {
    await supabase
      .from('iot_devices')
      .update({ network_status: 'offline' })
      .eq('device_id', deviceId);

    setDevices(prev =>
      prev.map(d => d.device_id === deviceId ? { ...d, network_status: 'offline' as const } : d)
    );

    setTimeout(async () => {
      const { data } = await supabase
        .from('iot_devices')
        .update({ network_status: 'online', last_ping: new Date().toISOString() })
        .eq('device_id', deviceId)
        .select()
        .single();

      if (data) {
        setDevices(prev => prev.map(d => d.device_id === deviceId ? data as Device : d));
      }
    }, 3000);
  };

  const updateFirmware = async (deviceId: string, version: string): Promise<Device> => {
    const { data, error: updateError } = await supabase
      .from('iot_devices')
      .update({ firmware_version: version })
      .eq('device_id', deviceId)
      .select()
      .single();

    if (updateError) throw updateError;
    const updated = data as Device;
    setDevices(prev => prev.map(d => d.device_id === deviceId ? updated : d));
    return updated;
  };

  const updateDevicePing = async (deviceId: string) => {
    const { data } = await supabase
      .from('iot_devices')
      .update({ last_ping: new Date().toISOString(), network_status: 'online' })
      .eq('device_id', deviceId)
      .select()
      .single();

    if (data) {
      setDevices(prev => prev.map(d => d.device_id === deviceId ? data as Device : d));
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    registerDevice,
    updateDevice,
    deleteDevice,
    rebootDevice,
    updateFirmware,
    updateDevicePing,
    refetch: loadDevices,
  };
}
