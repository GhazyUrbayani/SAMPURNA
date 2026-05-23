import { supabase } from '../api/supabase-client';
import type { Database } from '../types/database.types';

type IoTDevice = Database['public']['Tables']['iot_devices']['Row'];
type IoTDeviceInsert = Database['public']['Tables']['iot_devices']['Insert'];
type IoTDeviceUpdate = Database['public']['Tables']['iot_devices']['Update'];

/**
 * Fetch all IoT devices
 */
export async function getAllDevices() {
  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get device by ID
 */
export async function getDeviceById(deviceId: string) {
  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get online devices
 */
export async function getOnlineDevices() {
  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('network_status', 'online');

  if (error) throw error;
  return data;
}

/**
 * Get devices with low battery
 */
export async function getLowBatteryDevices(threshold: number = 30) {
  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .lt('battery_level', threshold)
    .order('battery_level', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Register new device
 */
export async function registerDevice(device: IoTDeviceInsert) {
  const { data, error } = await supabase
    .from('iot_devices')
    .insert(device)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update device configuration
 */
export async function updateDevice(deviceId: string, updates: IoTDeviceUpdate) {
  const { data, error } = await supabase
    .from('iot_devices')
    .update(updates)
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update device ping timestamp
 */
export async function updateDevicePing(deviceId: string) {
  const { data, error } = await supabase
    .from('iot_devices')
    .update({
      last_ping: new Date().toISOString(),
      network_status: 'online',
    })
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update device battery level
 */
export async function updateDeviceBattery(deviceId: string, batteryLevel: number) {
  const { data, error } = await supabase
    .from('iot_devices')
    .update({ battery_level: batteryLevel })
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string) {
  const { error } = await supabase
    .from('iot_devices')
    .delete()
    .eq('device_id', deviceId);

  if (error) throw error;
  return true;
}

/**
 * Simulate device reboot
 */
export async function rebootDevice(deviceId: string) {
  // Set to offline temporarily
  await supabase
    .from('iot_devices')
    .update({ network_status: 'offline' })
    .eq('device_id', deviceId);

  // Simulate reboot delay (30 seconds)
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Set back to online
  const { data, error } = await supabase
    .from('iot_devices')
    .update({
      network_status: 'online',
      last_ping: new Date().toISOString(),
    })
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update device firmware version
 */
export async function updateDeviceFirmware(deviceId: string, version: string) {
  const { data, error } = await supabase
    .from('iot_devices')
    .update({ firmware_version: version })
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
