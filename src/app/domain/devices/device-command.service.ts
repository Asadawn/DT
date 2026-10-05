import { Injectable, inject, signal } from '@angular/core';
import type { DeviceProperty } from '../../shared/types/canonical.types';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { DeviceEventService } from './device-event.service';
import { formatEventValue } from './device-event.fixtures';
import { DeviceService } from './device.service';

function commandKey(deviceId: string, propertyId: string): string {
  return `${deviceId}:${propertyId}`;
}

@Injectable({ providedIn: 'root' })
export class DeviceCommandService {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceEventService = inject(DeviceEventService);

  private readonly pendingKeys = signal<ReadonlySet<string>>(new Set());
  private readonly lastResult = signal<{ key: string; result: 'success' | 'error' } | null>(null);

  isPending(deviceId: string, propertyId: string): boolean {
    return this.pendingKeys().has(commandKey(deviceId, propertyId));
  }

  hasError(deviceId: string, propertyId: string): boolean {
    const last = this.lastResult();
    return !!last && last.key === commandKey(deviceId, propertyId) && last.result === 'error';
  }

  async sendCommand(
    deviceId: string,
    property: DeviceProperty,
    value: DeviceProperty['value'],
  ): Promise<boolean> {
    const key = commandKey(deviceId, property.id);
    this.pendingKeys.update((set) => new Set(set).add(key));
    const previousValue = property.value;

    this.deviceService.updateProperty(deviceId, property.id, value);
    this.deviceEventService.record(
      deviceId,
      'command-sent',
      `${property.label} → ${formatEventValue(value)} requested.`,
    );

    await simulateLatency(600);
    const succeeded = Math.random() > 0.12;

    if (succeeded) {
      this.lastResult.set({ key, result: 'success' });
      this.deviceEventService.record(
        deviceId,
        'command-confirmed',
        `${property.label} set to ${formatEventValue(value)}.`,
      );
    } else {
      this.deviceService.updateProperty(deviceId, property.id, previousValue);
      this.lastResult.set({ key, result: 'error' });
      this.deviceEventService.record(
        deviceId,
        'command-failed',
        `${property.label} → ${formatEventValue(value)} failed; rolled back.`,
      );
    }

    this.pendingKeys.update((set) => {
      const next = new Set(set);
      next.delete(key);
      return next;
    });

    return succeeded;
  }
}
