import { Injectable, resource } from '@angular/core';
import type { DeviceProperty } from '../../shared/types/canonical.types';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { DEVICE_CATEGORY_CONFIG } from './device-registry';
import { DEVICE_FIXTURES } from './device.fixtures';
import type { Device, DeviceFilter, NewDeviceInput } from './device.types';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly devicesResource = resource({
    defaultValue: [] as Device[],
    loader: async () => {
      await simulateLatency();
      return DEVICE_FIXTURES;
    },
  });

  readonly devices = this.devicesResource.value;
  readonly devicesLoading = this.devicesResource.isLoading;
  readonly devicesError = this.devicesResource.error;

  device(deviceId: string | null | undefined): Device | undefined {
    if (!deviceId) return undefined;
    return this.devices().find((d) => d.id === deviceId);
  }

  filtered(filters: DeviceFilter): Device[] {
    const search = filters.search?.trim().toLowerCase();
    return this.devices().filter((device) => {
      if (search && !device.name.toLowerCase().includes(search) && !device.id.includes(search)) {
        return false;
      }
      if (filters.buildingId && device.buildingId !== filters.buildingId) return false;
      if (filters.floorId && device.floorId !== filters.floorId) return false;
      if (filters.spaceId && device.spaceId !== filters.spaceId) return false;
      if (filters.category && device.category !== filters.category) return false;
      if (filters.connectivity && device.connectivity !== filters.connectivity) return false;
      return true;
    });
  }

  async create(input: NewDeviceInput): Promise<Device> {
    await simulateLatency(400);
    const id = `d${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const overrides = input.initialProperties ?? [];
    const registeredKeys = new Set(
      DEVICE_CATEGORY_CONFIG[input.category].metrics.map((m) => m.key),
    );

    const metricProperties: DeviceProperty[] = DEVICE_CATEGORY_CONFIG[input.category].metrics.map(
      (metric) => {
        const override = overrides.find((p) => p.key === metric.key);
        return {
          id: `${id}-${metric.key}`,
          key: metric.key,
          label: metric.label,
          value: override?.value ?? null,
          unit: metric.unit,
          valueType: 'number',
          writable: false,
          quality: override ? 'good' : 'unknown',
          updatedAt: override ? now : undefined,
        };
      },
    );
    const extraProperties: DeviceProperty[] = overrides
      .filter((p) => !registeredKeys.has(p.key))
      .map((p) => ({
        id: `${id}-${p.key}`,
        key: p.key,
        label: p.label,
        value: p.value,
        unit: p.unit,
        valueType: p.valueType,
        writable: p.writable ?? false,
        min: p.min,
        max: p.max,
        quality: 'good',
        updatedAt: now,
      }));

    const created: Device = {
      id,
      name: input.name,
      category: input.category,
      buildingId: input.buildingId,
      floorId: input.floorId,
      spaceId: input.spaceId,
      connectivity: input.connectivity,
      capabilities: input.capabilities,
      lastSeenAt: now,
      properties: input.capabilities.commands
        ? [
            {
              id: `${id}-power`,
              key: 'power',
              label: 'Power',
              value: false,
              valueType: 'boolean',
              writable: true,
              updatedAt: now,
              quality: 'good',
            },
            ...metricProperties,
            ...extraProperties,
          ]
        : [...metricProperties, ...extraProperties],
    };
    this.devicesResource.update((devices) => [created, ...devices]);
    return created;
  }

  updateProperty(deviceId: string, propertyId: string, value: DeviceProperty['value']): void {
    this.devicesResource.update((devices) =>
      devices.map((device) =>
        device.id !== deviceId
          ? device
          : {
              ...device,
              properties: device.properties.map((property) =>
                property.id !== propertyId
                  ? property
                  : { ...property, value, updatedAt: new Date().toISOString() },
              ),
            },
      ),
    );
  }
}
