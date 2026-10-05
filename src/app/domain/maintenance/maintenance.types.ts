export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus =
  'created' | 'triage' | 'assigned' | 'in-progress' | 'complete' | 'verify' | 'closed' | 'rejected';
export type MaintenanceCategory = 'hvac' | 'electrical' | 'plumbing' | 'general' | 'safety' | 'it';

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  hvac: 'HVAC',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  general: 'General',
  safety: 'Safety',
  it: 'IT',
};

export interface MaintenanceTimelineEntry {
  id: string;
  at: string;
  label: string;
  actor?: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  deviceId?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  category: MaintenanceCategory;
  requester: string;
  requesterContact?: string;
  requesterEmail?: string;
  imageDataUrl?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  timeline: MaintenanceTimelineEntry[];
  bookingId?: string;
}

export interface NewMaintenanceInput {
  title: string;
  description: string;
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  deviceId?: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  requester?: string;
  requesterContact?: string;
  requesterEmail?: string;
  imageDataUrl?: string;
  bookingId?: string;
}

export interface MaintenanceFilter {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  buildingId?: string;
  search?: string;
}
