import type { Building, Floor, Space } from './building.types';

export const BUILDING_FIXTURES: Building[] = [
  {
    id: 'b1',
    name: 'Harborview Tower',
    address: '400 Harborview Ave',
    city: 'Seattle, WA',
    timezone: 'America/Los_Angeles',
    floorCount: 3,
    imageColor: '#1B4143',
  },
  {
    id: 'b2',
    name: 'West Campus',
    address: '12 Innovation Way',
    city: 'Austin, TX',
    timezone: 'America/Chicago',
    floorCount: 2,
    imageColor: '#24B262',
  },
  {
    id: 'b3',
    name: 'Riverside Center',
    address: '88 Riverside Blvd',
    city: 'Chicago, IL',
    timezone: 'America/Chicago',
    floorCount: 2,
    imageColor: '#102826',
  },
];

export const FLOOR_FIXTURES: Floor[] = [
  { id: 'b1-f1', buildingId: 'b1', name: 'Floor 2', level: 2 },
  { id: 'b1-f2', buildingId: 'b1', name: 'Ground Floor', level: 0 },
  { id: 'b1-f3', buildingId: 'b1', name: 'Floor 3', level: 3 },

  { id: 'b2-f1', buildingId: 'b2', name: 'Ground Floor', level: 0 },
  { id: 'b2-f2', buildingId: 'b2', name: 'Floor 2', level: 2 },

  { id: 'b3-f1', buildingId: 'b3', name: 'Ground Floor', level: 0 },
  { id: 'b3-f2', buildingId: 'b3', name: 'Floor 2', level: 2 },
];

export const SPACE_FIXTURES: Space[] = [
  { id: 'b1-f2-s3', floorId: 'b1-f2', buildingId: 'b1', name: 'Manager Room', kind: 'office' },
  { id: 'b1-f1-s1', floorId: 'b1-f1', buildingId: 'b1', name: 'Main Lobby', kind: 'common-area' },
  { id: 'b1-f1-s2', floorId: 'b1-f1', buildingId: 'b1', name: 'Retail Suite A', kind: 'retail' },
  { id: 'b1-f2-s1', floorId: 'b1-f2', buildingId: 'b1', name: 'Open Office', kind: 'office' },
  {
    id: 'b1-f2-s2',
    floorId: 'b1-f2',
    buildingId: 'b1',
    name: 'Meeting Room',
    kind: 'meeting-room',
  },
  {
    id: 'b1-f3-s1',
    floorId: 'b1-f3',
    buildingId: 'b1',
    name: 'Mechanical Room',
    kind: 'mechanical',
  },
  { id: 'b1-f3-s2', floorId: 'b1-f3', buildingId: 'b1', name: 'Open Office 3A', kind: 'office' },

  { id: 'b2-f1-s1', floorId: 'b2-f1', buildingId: 'b2', name: 'Reception', kind: 'common-area' },
  { id: 'b2-f1-s2', floorId: 'b2-f1', buildingId: 'b2', name: 'Lab 1', kind: 'office' },
  { id: 'b2-f2-s1', floorId: 'b2-f2', buildingId: 'b2', name: 'Open Office 2A', kind: 'office' },

  { id: 'b3-f1-s1', floorId: 'b3-f1', buildingId: 'b3', name: 'Main Lobby', kind: 'common-area' },
  {
    id: 'b3-f2-s1',
    floorId: 'b3-f2',
    buildingId: 'b3',
    name: 'Conference Center',
    kind: 'meeting-room',
  },
  {
    id: 'b3-f2-s2',
    floorId: 'b3-f2',
    buildingId: 'b3',
    name: 'Mechanical Room',
    kind: 'mechanical',
  },
];
