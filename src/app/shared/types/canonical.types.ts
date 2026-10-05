export interface LocationRef {
  organizationId?: string;
  buildingId?: string;
  floorId?: string;
  spaceId?: string;
}

export type DeviceConnectivityStatus =
  'online' | 'offline' | 'stale' | 'warning' | 'error' | 'disabled' | 'unknown';

export interface DeviceCapabilities {
  telemetry: boolean;
  commands: boolean;
  scheduling: boolean;
  thresholds: boolean;
  battery?: boolean;
  signal?: boolean;
  environment?: boolean;
  energy?: boolean;
  occupancy?: boolean;
}

export type DevicePropertyValueType = 'number' | 'boolean' | 'string' | 'enum';
export type DevicePropertyQuality = 'good' | 'stale' | 'bad' | 'unknown';

export interface DeviceProperty {
  id: string;
  key: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  valueType: DevicePropertyValueType;
  writable: boolean;
  updatedAt?: string;
  quality?: DevicePropertyQuality;
  min?: number;
  max?: number;
}

export type TimeSeriesPointQuality = 'good' | 'missing' | 'stale' | 'bad';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number | null;
  quality?: TimeSeriesPointQuality;
}

export interface TimeSeries {
  metric: string;
  unit?: string;
  deviceId?: string;
  points: TimeSeriesPoint[];
}

export type TimeRangePreset = 'live' | '6h' | '12h' | '24h' | '7d' | '30d' | '6m';
export type TimeRangeGranularity = 'raw' | 'minute' | 'hour' | 'day' | 'month';

export interface TimeRange {
  preset?: TimeRangePreset;
  from: string;
  to: string;
  timezone: string;
  granularity: TimeRangeGranularity;
}

export type DeviceCategory =
  | 'environment'
  | 'energy-meter'
  | 'gas'
  | 'air-quality'
  | 'motion'
  | 'contact'
  | 'smoke'
  | 'water-leak'
  | 'light-switch'
  | 'fan'
  | 'socket'
  | 'lamp'
  | 'thermostat'
  | 'gateway-hub'
  | 'presence'
  | 'flow-meter'
  | 'camera'
  | 'lock'
  | 'generic-sensor'
  | 'generic-actuator'
  | 'unknown';

export type UiState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type LiveUiState = UiState | 'stale' | 'disconnected' | 'reconnecting';

export type MutationState = 'idle' | 'pending' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
}
