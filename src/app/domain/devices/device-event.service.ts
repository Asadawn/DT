import { Injectable, inject, signal } from '@angular/core';
import { DeviceService } from './device.service';
import { seededDeviceEvents } from './device-event.fixtures';
import type { DeviceEvent, DeviceEventType } from './device-event.types';

@Injectable({ providedIn: 'root' })
export class DeviceEventService {
  private readonly deviceService = inject(DeviceService);
  private readonly liveEvents = signal<DeviceEvent[]>([]);

  eventsFor(deviceId: string): DeviceEvent[] {
    const device = this.deviceService.device(deviceId);
    const seeded = device ? seededDeviceEvents(device) : [];
    const live = this.liveEvents().filter((e) => e.deviceId === deviceId);
    return [...live, ...seeded].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  record(deviceId: string, type: DeviceEventType, message: string): void {
    this.liveEvents.update((list) => [
      {
        id: `ev${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        deviceId,
        type,
        message,
        timestamp: new Date().toISOString(),
      },
      ...list,
    ]);
  }
}
