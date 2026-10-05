import type {
  DeviceCapabilities,
  DeviceCategory,
  DeviceConnectivityStatus,
  DeviceProperty,
} from '../../shared/types/canonical.types';

export interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  buildingId: string;
  floorId: string;
  spaceId?: string;
  connectivity: DeviceConnectivityStatus;
  capabilities: DeviceCapabilities;
  properties: DeviceProperty[];
  lastSeenAt: string;
}

export interface NewDeviceInput {
  name: string;
  externalId?: string;
  category: DeviceCategory;
  buildingId: string;
  floorId: string;
  spaceId?: string;
  capabilities: DeviceCapabilities;
  connectivity: DeviceConnectivityStatus;
  initialProperties?: Array<{
    key: string;
    label: string;
    value: DeviceProperty['value'];
    unit?: string;
    valueType: DeviceProperty['valueType'];
    writable?: boolean;
    min?: number;
    max?: number;
  }>;
}

export interface DeviceFilter {
  search?: string;
  buildingId?: string;
  floorId?: string;
  spaceId?: string;
  category?: DeviceCategory;
  connectivity?: DeviceConnectivityStatus;
}
