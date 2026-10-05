import type { MaintenancePriority } from '../maintenance/maintenance.types';

export type AutomationStatus = 'enabled' | 'disabled';
export type AutomationTriggerType = 'device-property' | 'time' | 'manual' | 'occupancy-changed';
export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';
export type AutomationActionType = 'device-command' | 'notification' | 'maintenance';
export type AutomationExecutionState = 'completed' | 'failed' | 'partially-failed';

export const AUTOMATION_TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  'device-property': 'Device property',
  time: 'Time of day',
  manual: 'Manual run only',
  'occupancy-changed': 'Occupancy changed',
};

export const AUTOMATION_ACTION_TYPE_LABELS: Record<AutomationActionType, string> = {
  'device-command': 'Send device command',
  notification: 'Send notification',
  maintenance: 'Create maintenance request',
};

export const COMPARISON_OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  '>': 'greater than',
  '<': 'less than',
  '>=': 'at least',
  '<=': 'at most',
  '==': 'equals',
  '!=': 'does not equal',
};

export interface AutomationTrigger {
  type: AutomationTriggerType;
  deviceId?: string;
  propertyId?: string;
  operator?: ComparisonOperator;
  value?: string;
  timeOfDay?: string;
  occupancyStatus?: 'occupied' | 'vacant';
}

export interface AutomationCondition {
  deviceId: string;
  propertyId: string;
  operator: ComparisonOperator;
  value: string;
}

export interface AutomationAction {
  type: AutomationActionType;
  deviceId?: string;
  propertyId?: string;
  value?: string;
  message?: string;
  maintenanceTitle?: string;
  maintenancePriority?: MaintenancePriority;
}

export interface AutomationSchedule {
  days: number[];
  startHour: number;
  endHour: number;
}

export function emptyAutomationSchedule(): AutomationSchedule {
  return { days: [1, 2, 3, 4, 5], startHour: 0, endHour: 24 };
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  schedule: AutomationSchedule | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewAutomationInput {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  schedule: AutomationSchedule | null;
}

export interface AutomationExecutionActionResult {
  action: string;
  success: boolean;
  detail?: string;
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  triggeredAt: string;
  triggerSource: string;
  finalState: AutomationExecutionState;
  actionResults: AutomationExecutionActionResult[];
}

export interface AutomationFilter {
  status?: AutomationStatus;
  buildingId?: string;
  search?: string;
}
