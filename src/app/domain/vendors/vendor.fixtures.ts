import type { Vendor, VendorInvitation } from './vendor.types';

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 24 * 60 * 60_000).toISOString();
const daysFromNow = (d: number) => new Date(NOW + d * 24 * 60 * 60_000).toISOString();

export const VENDOR_FIXTURES: Vendor[] = [
  {
    id: 'v1',
    name: 'Coolline HVAC Services',
    contactName: 'Ray Solano',
    contactEmail: 'ray@coolline-hvac.example',
    contactPhone: '(555) 011-2200',
    specialties: ['hvac'],
    status: 'active',
  },
  {
    id: 'v2',
    name: 'BrightVolt Electrical',
    contactName: 'Nina Cho',
    contactEmail: 'nina@brightvolt.example',
    contactPhone: '(555) 011-3311',
    specialties: ['electrical'],
    status: 'active',
  },
  {
    id: 'v3',
    name: 'FlowPro Plumbing & General',
    contactName: 'Tomas Reyes',
    contactEmail: 'tomas@flowpro.example',
    contactPhone: '(555) 011-4422',
    specialties: ['plumbing', 'general'],
    status: 'active',
  },
  {
    id: 'v4',
    name: 'SafeGuard Inspections',
    contactName: 'Alicia Ward',
    contactEmail: 'alicia@safeguard.example',
    contactPhone: '(555) 011-5533',
    specialties: ['safety'],
    status: 'inactive',
  },
];

export const VENDOR_INVITATION_FIXTURES: VendorInvitation[] = [
  {
    id: 'vi1',
    maintenanceId: 'm1',
    vendorId: 'v1',
    status: 'selected',
    invitedAt: daysAgo(3),
    respondedAt: daysAgo(2),
    quotation: {
      arrivalWindow: 'Tomorrow, 8am–10am',
      durationHours: 4,
      laborCost: 480,
      materialCost: 120,
      notes: 'Likely a failing compressor mount — will confirm on site.',
      validUntil: daysFromNow(7),
    },
    technicianName: 'Ray Solano',
    jobStatus: 'in-progress',
    evidence: [
      {
        id: 'vi1-e1',
        at: daysAgo(1),
        note: 'Arrived on site, inspecting rooftop compressor mount.',
      },
    ],
  },
  {
    id: 'vi2',
    maintenanceId: 'm1',
    vendorId: 'v3',
    status: 'not-selected',
    invitedAt: daysAgo(3),
    respondedAt: daysAgo(2),
    quotation: {
      arrivalWindow: 'This week, flexible',
      durationHours: 6,
      laborCost: 620,
      materialCost: 150,
      notes: 'Can send a technician within 48 hours.',
      validUntil: daysFromNow(5),
    },
    evidence: [],
  },
  {
    id: 'vi3',
    maintenanceId: 'm1',
    vendorId: 'v2',
    status: 'declined',
    invitedAt: daysAgo(3),
    respondedAt: daysAgo(3),
    evidence: [],
  },
  {
    id: 'vi4',
    maintenanceId: 'm3',
    vendorId: 'v3',
    status: 'quoted',
    invitedAt: daysAgo(0.2),
    respondedAt: daysAgo(0.1),
    quotation: {
      arrivalWindow: 'Today, ASAP',
      durationHours: 3,
      laborCost: 390,
      materialCost: 80,
      notes: 'Emergency call-out rate applies — leak sensor location noted.',
      validUntil: daysFromNow(1),
    },
    evidence: [],
  },
  {
    id: 'vi5',
    maintenanceId: 'm2',
    vendorId: 'v2',
    status: 'invited',
    invitedAt: daysAgo(1),
    evidence: [],
  },
];
