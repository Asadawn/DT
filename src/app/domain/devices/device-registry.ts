import type { DeviceCategory } from '../../shared/types/canonical.types';

export interface DeviceMetricDef {
  key: string;
  label: string;
  unit?: string;
}

export interface DeviceCategoryConfig {
  label: string;
  icon: string;
  metrics: DeviceMetricDef[];
  chartType?: 'line' | 'bar';
}

export const DEVICE_CATEGORY_CONFIG: Record<DeviceCategory, DeviceCategoryConfig> = {
  environment: {
    label: 'Environment',
    icon: '◐',
    metrics: [
      { key: 'temperature', label: 'Temperature', unit: '°F' },
      { key: 'humidity', label: 'Humidity', unit: '%' },
    ],
  },
  thermostat: {
    label: 'Thermostat',
    icon: '♨',
    metrics: [
      { key: 'temperature', label: 'Temperature', unit: '°F' },
      { key: 'humidity', label: 'Humidity', unit: '%' },
    ],
  },
  'energy-meter': {
    label: 'Energy Meter',
    icon: '⚡',
    metrics: [
      { key: 'activePower', label: 'Active Power', unit: 'kW' },
      { key: 'energy', label: 'Energy', unit: 'kWh' },
      { key: 'voltage', label: 'Voltage', unit: 'V' },
      { key: 'current', label: 'Current', unit: 'A' },
      { key: 'powerFactor', label: 'Power Factor', unit: '' },
      { key: 'frequency', label: 'Frequency', unit: 'Hz' },
      { key: 'reactivePower', label: 'Reactive Power', unit: 'kVAR' },
      { key: 'apparentPower', label: 'Apparent Power', unit: 'kVA' },
    ],
  },
  gas: {
    label: 'Gas',
    icon: '☁',
    metrics: [
      { key: 'co2', label: 'CO₂', unit: 'ppm' },
      { key: 'co', label: 'CO', unit: 'ppm' },
    ],
    chartType: 'bar',
  },
  'air-quality': {
    label: 'Air Quality',
    icon: '❋',
    metrics: [
      { key: 'aqi', label: 'AQI', unit: '' },
      { key: 'iaq', label: 'IAQ Index', unit: '' },
      { key: 'tvoc', label: 'TVOC', unit: 'ppb' },
      { key: 'eco2', label: 'eCO2', unit: 'ppm' },
      { key: 'pm1', label: 'PM 1.0', unit: 'µg/m³' },
      { key: 'pm25', label: 'PM 2.5', unit: 'µg/m³' },
      { key: 'pm10', label: 'PM 10', unit: 'µg/m³' },
    ],
  },
  motion: {
    label: 'Motion',
    icon: '◉',
    metrics: [{ key: 'detections', label: 'Detections (24h)', unit: '' }],
  },
  contact: {
    label: 'Contact',
    icon: '▭',
    metrics: [],
  },
  smoke: {
    label: 'Smoke',
    icon: '▲',
    metrics: [],
  },
  'water-leak': {
    label: 'Water Leak',
    icon: '◈',
    metrics: [],
  },
  'light-switch': {
    label: 'Light Switch',
    icon: '⏻',
    metrics: [{ key: 'load', label: 'Load', unit: 'W' }],
  },
  fan: {
    label: 'Fan',
    icon: '↻',
    metrics: [{ key: 'load', label: 'Load', unit: 'W' }],
  },
  socket: {
    label: 'Socket',
    icon: '⏚',
    metrics: [
      { key: 'load', label: 'Load', unit: 'W' },
      { key: 'voltage', label: 'Voltage', unit: 'V' },
    ],
  },
  lamp: {
    label: 'Lamp',
    icon: '✺',
    metrics: [{ key: 'load', label: 'Load', unit: 'W' }],
  },
  'gateway-hub': {
    label: 'Gateway / Hub',
    icon: '◫',
    metrics: [{ key: 'connectedDevices', label: 'Connected Devices', unit: '' }],
  },
  presence: {
    label: 'Presence',
    icon: '⚉',
    metrics: [{ key: 'occupancyMinutes', label: 'Occupancy Today', unit: 'min' }],
  },
  'flow-meter': {
    label: 'Flow Meter',
    icon: '≋',
    metrics: [
      { key: 'flowRate', label: 'Flow Rate', unit: 'L/min' },
      { key: 'totalVolume', label: 'Total Volume', unit: 'L' },
    ],
  },
  camera: {
    label: 'Camera',
    icon: '◎',
    metrics: [],
  },
  lock: {
    label: 'Door Lock',
    icon: '⚿',
    metrics: [],
  },
  'generic-sensor': {
    label: 'Sensor',
    icon: '○',
    metrics: [],
  },
  'generic-actuator': {
    label: 'Actuator',
    icon: '◇',
    metrics: [],
  },
  unknown: {
    label: 'Unknown Device',
    icon: '?',
    metrics: [],
  },
};

export const DEVICE_INDICATOR_ICON: Partial<Record<DeviceCategory, string>> = {
  environment: '/assets/sensor/thermometer%20indicator%201.svg',
  'energy-meter': '/assets/sensor/energy%20indicator%201.svg',
  gas: '/assets/sensor/gas%20leak%20indicator.svg',
  'air-quality': '/assets/sensor/air%20indicator%201.svg',
  motion: '/assets/sensor/motion%20indicator.svg',
  contact: '/assets/sensor/contact%20indicator%201.svg',
  smoke: '/assets/sensor/smoke%20sensor%20indicator%201.svg',
  'water-leak': '/assets/sensor/water%20leak%20indicator.svg',
  'light-switch': '/assets/sensor/smart%20switch%20indicator%201.svg',
  fan: '/assets/sensor/smart%20switch%20indicator%201.svg',
  socket: '/assets/sensor/smart%20switch%20indicator%201.svg',
  lamp: '/assets/sensor/smart%20switch%20indicator%201.svg',
  thermostat: '/assets/sensor/thermometer%20indicator%201.svg',
  'gateway-hub': '/assets/sensor/gateway%20indicator.svg',
};

export const DEVICE_CARD_ICON: Record<DeviceCategory, string> = {
  environment: 'lucideThermometer',
  thermostat: 'lucideThermometer',
  'energy-meter': 'lucideZap',
  gas: 'lucideWind',
  'air-quality': 'lucideWind',
  motion: 'lucideActivity',
  contact: 'lucideDoorOpen',
  smoke: 'lucideFlame',
  'water-leak': 'lucideDroplets',
  'light-switch': 'lucideLightbulb',
  fan: 'lucideFan',
  socket: 'lucidePlug',
  lamp: 'lucideLamp',
  'gateway-hub': 'lucideWifi',
  presence: 'lucideScanFace',
  'flow-meter': 'lucideWaves',
  camera: 'lucideCamera',
  lock: 'lucideLock',
  'generic-sensor': 'lucideGauge',
  'generic-actuator': 'lucideGauge',
  unknown: 'lucideGauge',
};

export const PROPERTY_ICON: Partial<Record<string, string>> = {
  battery: 'lucideBatteryMedium',
  state: 'lucideAlertCircle',
  power: 'lucidePower',
  on: 'lucidePower',
  locked: 'lucideLock',
  load: 'lucideZap',
  activePower: 'lucideZap',
  apparentPower: 'lucideZap',
  reactivePower: 'lucideZap',
  energy: 'lucideZap',
  voltage: 'lucideZap',
  current: 'lucideZap',
  powerFactor: 'lucideZap',
  frequency: 'lucideZap',
  temperature: 'lucideThermometer',
  targetTemperature: 'lucideThermometer',
  humidity: 'lucideDroplets',
  brightness: 'lucideSun',
  speed: 'lucideGauge',
  raw: 'lucideGauge',
  sensitivity: 'lucideGauge',
  occupancyMinutes: 'lucideUsers',
  presence: 'lucideScanFace',
  aqi: 'lucideWind',
  iaq: 'lucideWind',
  tvoc: 'lucideWind',
  pm1: 'lucideWind',
  pm10: 'lucideWind',
  pm25: 'lucideWind',
  co: 'lucideWind',
  co2: 'lucideWind',
  eco2: 'lucideWind',
  flowRate: 'lucideWaves',
  totalVolume: 'lucideWaves',
  connectedDevices: 'lucideWifi',
  lastMethod: 'lucideKeyRound',
  detections: 'lucideActivity',
};
