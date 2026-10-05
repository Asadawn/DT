export type DeviceEventType = 'online' | 'offline' | 'command-sent' | 'command-confirmed' | 'command-failed';

export interface DeviceEvent {
  id: string;
  deviceId: string;
  type: DeviceEventType;
  message: string;
  timestamp: string;
}
