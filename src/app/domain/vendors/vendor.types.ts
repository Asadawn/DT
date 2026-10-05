import type { MaintenanceCategory } from '../maintenance/maintenance.types';

export type VendorStatus = 'active' | 'inactive';

export type VendorInvitationStatus =
  'invited' | 'viewed' | 'quoted' | 'selected' | 'not-selected' | 'declined' | 'expired';

export type VendorJobStatus = 'assigned' | 'in-progress' | 'complete';

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialties: MaintenanceCategory[];
  status: VendorStatus;
}

export interface NewVendorInput {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialties: MaintenanceCategory[];
}

export interface VendorQuotation {
  arrivalWindow: string;
  durationHours: number;
  laborCost: number;
  materialCost: number;
  notes: string;
  validUntil: string;
}

export interface VendorJobEvidenceEntry {
  id: string;
  at: string;
  note: string;
}

export interface VendorInvitation {
  id: string;
  maintenanceId: string;
  vendorId: string;
  status: VendorInvitationStatus;
  invitedAt: string;
  respondedAt?: string;
  quotation?: VendorQuotation;
  technicianName?: string;
  jobStatus?: VendorJobStatus;
  evidence: VendorJobEvidenceEntry[];
}

export interface VendorFilter {
  search?: string;
  specialty?: MaintenanceCategory;
  status?: VendorStatus;
}
