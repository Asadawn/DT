import type { DeviceProperty } from '../../shared/types/canonical.types';
import type { DeviceService } from '../devices/device.service';
import type {
  Automation,
  AutomationAction,
  AutomationCondition,
  ComparisonOperator,
} from './automation.types';

function deviceLabel(deviceService: DeviceService, deviceId?: string): string {
  return deviceService.device(deviceId)?.name ?? deviceId ?? 'device';
}

function findProperty(
  deviceService: DeviceService,
  deviceId?: string,
  propertyId?: string,
): DeviceProperty | undefined {
  return deviceService.device(deviceId)?.properties.find((p) => p.id === propertyId);
}

function propertyLabel(
  deviceService: DeviceService,
  deviceId?: string,
  propertyId?: string,
): string {
  return findProperty(deviceService, deviceId, propertyId)?.label ?? propertyId ?? 'property';
}

const TRIGGER_OPERATOR_PHRASES: Record<ComparisonOperator, string> = {
  '==': 'is',
  '!=': 'is not',
  '>': 'is greater than',
  '<': 'is less than',
  '>=': 'is at least',
  '<=': 'is at most',
};

function formatComparisonValue(
  value: string | undefined,
  property: DeviceProperty | undefined,
): string {
  if (value === undefined || value === '') return '';
  if (property?.valueType === 'boolean') {
    if (property.key === 'locked') return value === 'true' ? 'Locked' : 'Unlocked';
    if (value === 'true') return 'On';
    if (value === 'false') return 'Off';
  }
  return property?.unit ? `${value}${property.unit}` : value;
}

export function describeTrigger(automation: Automation, deviceService: DeviceService): string {
  const trigger = automation.trigger;
  switch (trigger.type) {
    case 'device-property': {
      const device = deviceLabel(deviceService, trigger.deviceId);
      const property = findProperty(deviceService, trigger.deviceId, trigger.propertyId);
      const phrase = trigger.operator ? TRIGGER_OPERATOR_PHRASES[trigger.operator] : 'is';
      const value = formatComparisonValue(trigger.value, property);
      if (property?.key === 'locked') {
        return `When ${device} is ${value}`;
      }
      const propertyName = property?.label ?? trigger.propertyId ?? 'property';
      return `When ${device}'s ${propertyName} ${phrase} ${value}`.trim();
    }
    case 'time':
      return `Every day at ${trigger.timeOfDay || '--:--'}`;
    case 'manual':
      return 'Runs only when started manually';
    case 'occupancy-changed':
      return `When the room becomes ${trigger.occupancyStatus ?? 'occupied'}`;
  }
}

export function describeCondition(
  condition: AutomationCondition,
  deviceService: DeviceService,
): string {
  return `${deviceLabel(deviceService, condition.deviceId)} — ${propertyLabel(deviceService, condition.deviceId, condition.propertyId)} ${condition.operator} ${condition.value}`;
}

export function describeAction(action: AutomationAction, deviceService: DeviceService): string {
  switch (action.type) {
    case 'device-command':
      return `Set ${deviceLabel(deviceService, action.deviceId)} ${propertyLabel(deviceService, action.deviceId, action.propertyId)} to ${action.value}`;
    case 'notification':
      return `Notify: ${action.message}`;
    case 'maintenance':
      return `Create maintenance: ${action.maintenanceTitle} (${action.maintenancePriority ?? 'medium'})`;
  }
}
