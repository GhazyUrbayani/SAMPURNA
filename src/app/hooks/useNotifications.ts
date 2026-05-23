import { useState, useEffect, useMemo } from 'react';
import { useBins, Bin } from './useBins';

const READ_KEY = 'sampurna_notifications_read';

export interface Notification {
  id: string;
  binId: string;
  location: string;
  capacity: number;
  status: Bin['status'];
  severity: 'critical' | 'warning' | 'offline';
  message: string;
  timestamp: string;
}

function buildNotifications(bins: Bin[]): Notification[] {
  return bins
    .filter(b => b.status === 'critical' || b.status === 'warning' || b.status === 'offline')
    .map(b => {
      const severity: Notification['severity'] =
        b.status === 'critical' ? 'critical' : b.status === 'offline' ? 'offline' : 'warning';
      const message =
        b.status === 'offline'
          ? 'Device is offline — last reading unavailable'
          : b.status === 'critical'
          ? `Bin capacity at ${b.capacity_percentage}% — Requires immediate pickup`
          : `Bin capacity at ${b.capacity_percentage}% — Approaching threshold`;
      const stamp = b.last_updated ?? new Date().toISOString();
      return {
        id: `${b.bin_id}:${stamp}`,
        binId: b.bin_id,
        location: b.location,
        capacity: b.capacity_percentage,
        status: b.status,
        severity,
        message,
        timestamp: stamp,
      };
    })
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, offline: 2 };
      if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
      return b.timestamp.localeCompare(a.timestamp);
    });
}

export function useNotifications() {
  const { bins } = useBins();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const notifications = useMemo(() => buildNotifications(bins), [bins]);

  useEffect(() => {
    const currentIds = new Set(notifications.map(n => n.id));
    setReadIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => { if (currentIds.has(id)) next.add(id); });
      if (next.size === prev.size) return prev;
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(READ_KEY, JSON.stringify(allIds));
    setReadIds(new Set(allIds));
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return { notifications, unreadCount, markAllAsRead, markAsRead, readIds };
}
