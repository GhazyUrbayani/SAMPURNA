export interface TrashBin {
  id: string;
  name: string;
  location: string;
  fullness: number;
  lastUpdated: Date;
  deviceId: string;
  status: 'critical' | 'warning' | 'normal';
}

export interface IoTDevice {
  id: string;
  deviceId: string;
  location: string;
  batteryLevel: number;
  networkStatus: 'online' | 'offline';
  thresholdLimit: number;
  lastPing: Date;
}

export interface HistoricalData {
  date: string;
  volume: number;
  zone: string;
}

// Mock trash bins data
export const trashBins: TrashBin[] = [
  {
    id: '1',
    name: 'Labtek V - Floor 1',
    location: 'Labtek V Building',
    fullness: 85,
    lastUpdated: new Date(Date.now() - 5 * 60000),
    deviceId: 'ESP32-001',
    status: 'critical',
  },
  {
    id: '2',
    name: 'Labtek V - Lobby',
    location: 'Labtek V Building',
    fullness: 45,
    lastUpdated: new Date(Date.now() - 10 * 60000),
    deviceId: 'ESP32-002',
    status: 'normal',
  },
  {
    id: '3',
    name: 'Labtek VIII - Floor 2',
    location: 'Labtek VIII Building',
    fullness: 65,
    lastUpdated: new Date(Date.now() - 15 * 60000),
    deviceId: 'ESP32-003',
    status: 'warning',
  },
  {
    id: '4',
    name: 'Labtek VIII - Cafeteria',
    location: 'Labtek VIII Building',
    fullness: 92,
    lastUpdated: new Date(Date.now() - 3 * 60000),
    deviceId: 'ESP32-004',
    status: 'critical',
  },
  {
    id: '5',
    name: 'Library - Main Hall',
    location: 'Central Library',
    fullness: 38,
    lastUpdated: new Date(Date.now() - 20 * 60000),
    deviceId: 'ESP32-005',
    status: 'normal',
  },
  {
    id: '6',
    name: 'Library - Reading Room',
    location: 'Central Library',
    fullness: 55,
    lastUpdated: new Date(Date.now() - 8 * 60000),
    deviceId: 'ESP32-006',
    status: 'warning',
  },
  {
    id: '7',
    name: 'Student Center - East Wing',
    location: 'Student Center',
    fullness: 78,
    lastUpdated: new Date(Date.now() - 12 * 60000),
    deviceId: 'ESP32-007',
    status: 'warning',
  },
  {
    id: '8',
    name: 'Student Center - Food Court',
    location: 'Student Center',
    fullness: 22,
    lastUpdated: new Date(Date.now() - 7 * 60000),
    deviceId: 'ESP32-008',
    status: 'normal',
  },
];

// Mock IoT devices data
export const iotDevices: IoTDevice[] = [
  {
    id: '1',
    deviceId: 'ESP32-001',
    location: 'Labtek V - Floor 1',
    batteryLevel: 78,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 2 * 60000),
  },
  {
    id: '2',
    deviceId: 'ESP32-002',
    location: 'Labtek V - Lobby',
    batteryLevel: 92,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 1 * 60000),
  },
  {
    id: '3',
    deviceId: 'ESP32-003',
    location: 'Labtek VIII - Floor 2',
    batteryLevel: 65,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 3 * 60000),
  },
  {
    id: '4',
    deviceId: 'ESP32-004',
    location: 'Labtek VIII - Cafeteria',
    batteryLevel: 45,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 1 * 60000),
  },
  {
    id: '5',
    deviceId: 'ESP32-005',
    location: 'Library - Main Hall',
    batteryLevel: 88,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '6',
    deviceId: 'ESP32-006',
    location: 'Library - Reading Room',
    batteryLevel: 15,
    networkStatus: 'offline',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 45 * 60000),
  },
  {
    id: '7',
    deviceId: 'ESP32-007',
    location: 'Student Center - East Wing',
    batteryLevel: 72,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 2 * 60000),
  },
  {
    id: '8',
    deviceId: 'ESP32-008',
    location: 'Student Center - Food Court',
    batteryLevel: 95,
    networkStatus: 'online',
    thresholdLimit: 80,
    lastPing: new Date(Date.now() - 1 * 60000),
  },
];

// Mock historical data for charts
export const last7DaysData: HistoricalData[] = [
  { date: '2026-04-03', volume: 245, zone: 'All Zones' },
  { date: '2026-04-04', volume: 278, zone: 'All Zones' },
  { date: '2026-04-05', volume: 312, zone: 'All Zones' },
  { date: '2026-04-06', volume: 289, zone: 'All Zones' },
  { date: '2026-04-07', volume: 356, zone: 'All Zones' },
  { date: '2026-04-08', volume: 398, zone: 'All Zones' },
  { date: '2026-04-09', volume: 425, zone: 'All Zones' },
];

export const zoneComparisonData = [
  { zone: 'Labtek V', volume: 156 },
  { zone: 'Labtek VIII', volume: 203 },
  { zone: 'Library', volume: 98 },
  { zone: 'Student Center', volume: 187 },
];
