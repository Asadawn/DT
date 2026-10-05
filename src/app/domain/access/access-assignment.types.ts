export type AccessPrincipalType = 'staff' | 'vendor-technician' | 'guest';

export type AccessAssignmentStatus = 'scheduled' | 'active' | 'expired' | 'revoked';

export interface AccessAssignment {
  id: string;
  principalName: string;
  principalType: AccessPrincipalType;
  roleLabel: string;
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  revokedAt?: string;
  maintenanceId?: string;
  vendorId?: string;
}

export interface NewAccessAssignmentInput {
  principalName: string;
  principalType: AccessPrincipalType;
  roleLabel: string;
  buildingId: string;
  floorId?: string;
  spaceId?: string;
  validFrom: string;
  validUntil: string;
  maintenanceId?: string;
  vendorId?: string;
}

export interface AccessAssignmentFilter {
  status?: AccessAssignmentStatus;
  buildingId?: string;
  search?: string;
}
