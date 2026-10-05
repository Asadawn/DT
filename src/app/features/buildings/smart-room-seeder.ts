import type { AutomationService } from '../../domain/automations/automation.service';
import type { Space } from '../../domain/buildings/building.types';
import type { DeviceService } from '../../domain/devices/device.service';

export async function seedSmartRoom(
  deviceService: DeviceService,
  automationService: AutomationService,
  space: Space,
): Promise<void> {
  const loc = {
    buildingId: space.buildingId,
    floorId: space.floorId,
    spaceId: space.id,
    connectivity: 'online' as const,
  };

  const fan = await deviceService.create({
    ...loc,
    name: 'Fan',
    category: 'fan',
    capabilities: {
      telemetry: true,
      commands: true,
      scheduling: true,
      thresholds: false,
      energy: true,
    },
    initialProperties: [
      { key: 'load', label: 'Load', value: 65, unit: 'W', valueType: 'number' },
      { key: 'energy', label: 'Energy Today', value: 0.6, unit: 'kWh', valueType: 'number' },
      {
        key: 'speed',
        label: 'Speed',
        value: 2,
        unit: '',
        valueType: 'number',
        writable: true,
        min: 1,
        max: 3,
      },
    ],
  });
  const lights = await deviceService.create({
    ...loc,
    name: 'Lights',
    category: 'light-switch',
    capabilities: {
      telemetry: true,
      commands: true,
      scheduling: true,
      thresholds: false,
      energy: true,
    },
    initialProperties: [
      { key: 'load', label: 'Load', value: 280, unit: 'W', valueType: 'number' },
      { key: 'energy', label: 'Energy Today', value: 2.1, unit: 'kWh', valueType: 'number' },
    ],
  });
  const ac = await deviceService.create({
    ...loc,
    name: 'AC',
    category: 'thermostat',
    capabilities: {
      telemetry: true,
      commands: true,
      scheduling: false,
      thresholds: true,
      environment: true,
      energy: true,
    },
    initialProperties: [
      { key: 'temperature', label: 'Temperature', value: 75.3, unit: '°F', valueType: 'number' },
      { key: 'humidity', label: 'Humidity', value: 44, unit: '%', valueType: 'number' },
      { key: 'energy', label: 'Energy Today', value: 3.4, unit: 'kWh', valueType: 'number' },
      {
        key: 'targetTemperature',
        label: 'Set Temperature',
        value: 72,
        unit: '°F',
        valueType: 'number',
        writable: true,
        min: 60,
        max: 85,
      },
    ],
  });
  for (const device of [fan, lights, ac]) {
    const power = device.properties.find((p) => p.writable);
    if (power) deviceService.updateProperty(device.id, power.id, true);
  }

  const door = await deviceService.create({
    ...loc,
    name: 'Door Contact',
    category: 'contact',
    capabilities: { telemetry: true, commands: false, scheduling: false, thresholds: false },
    initialProperties: [{ key: 'state', label: 'Door State', value: 'closed', valueType: 'enum' }],
  });
  await deviceService.create({
    ...loc,
    name: 'Motion Sensor',
    category: 'motion',
    capabilities: {
      telemetry: true,
      commands: false,
      scheduling: false,
      thresholds: false,
      occupancy: true,
      battery: true,
    },
    initialProperties: [
      { key: 'detections', label: 'Detections (24h)', value: 5, unit: '', valueType: 'number' },
      { key: 'battery', label: 'Battery', value: 87, unit: '%', valueType: 'number' },
      { key: 'sensitivity', label: 'Sensitivity', value: 'medium', valueType: 'enum' },
    ],
  });
  await deviceService.create({
    ...loc,
    name: 'AQI Sensor',
    category: 'air-quality',
    capabilities: { telemetry: true, commands: false, scheduling: false, thresholds: true },
    initialProperties: [
      { key: 'aqi', label: 'AQI', value: 41, unit: '', valueType: 'number' },
      { key: 'iaq', label: 'IAQ Index', value: 45, unit: '', valueType: 'number' },
      { key: 'tvoc', label: 'TVOC', value: 150, unit: 'ppb', valueType: 'number' },
      { key: 'eco2', label: 'eCO2', value: 580, unit: 'ppm', valueType: 'number' },
      { key: 'pm1', label: 'PM 1.0', value: 7, unit: 'µg/m³', valueType: 'number' },
      { key: 'pm25', label: 'PM 2.5', value: 11, unit: 'µg/m³', valueType: 'number' },
      { key: 'pm10', label: 'PM 10', value: 16, unit: 'µg/m³', valueType: 'number' },
    ],
  });

  const doorState = door.properties.find((p) => p.key === 'state');
  const lightsPower = lights.properties.find((p) => p.writable);
  if (doorState && lightsPower) {
    const automation = await automationService.save(null, {
      name: `${space.name} — Entry Lighting`,
      description: 'Turns the lights on when the door opens.',
      trigger: {
        type: 'device-property',
        deviceId: door.id,
        propertyId: doorState.id,
        operator: '==',
        value: 'open',
      },
      conditions: [],
      actions: [
        { type: 'device-command', deviceId: lights.id, propertyId: lightsPower.id, value: 'true' },
      ],
      buildingId: space.buildingId,
      floorId: space.floorId,
      spaceId: space.id,
      schedule: null,
    });
    await automationService.setStatus(automation.id, 'enabled');
  }
}
