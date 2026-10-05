import type { Device } from './device.types';
import type { DeviceEvent } from './device-event.types';

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function stableIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export function formatEventValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (value === null || value === undefined) return '—';
  return String(value);
}

export function seededDeviceEvents(device: Device): DeviceEvent[] {
  const events: DeviceEvent[] = [];
  const offset = stableIndex(device.id, 180);

  if (device.connectivity === 'offline' || device.connectivity === 'stale') {
    events.push({
      id: `${device.id}-ev-offline`,
      deviceId: device.id,
      type: 'offline',
      message: 'Device stopped responding.',
      timestamp: minutesAgo(offset + 20),
    });
  } else {
    events.push({
      id: `${device.id}-ev-online`,
      deviceId: device.id,
      type: 'online',
      message: 'Device came online.',
      timestamp: minutesAgo(offset + 720),
    });
  }

  const writable = device.properties.find((p) => p.writable);
  if (device.capabilities.commands && writable) {
    events.push({
      id: `${device.id}-ev-cmd`,
      deviceId: device.id,
      type: 'command-confirmed',
      message: `${writable.label} set to ${formatEventValue(writable.value)}.`,
      timestamp: minutesAgo(offset + 5),
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
