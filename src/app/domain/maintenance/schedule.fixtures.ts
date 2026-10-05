import { emptyWeeklyGrid, type Schedule } from './schedule.types';

function businessHours(): boolean[][] {
  const grid = emptyWeeklyGrid();
  for (let day = 1; day <= 5; day++) {
    for (let hour = 8; hour < 18; hour++) {
      grid[day][hour] = true;
    }
  }
  return grid;
}

function alwaysOn(): boolean[][] {
  return emptyWeeklyGrid().map((day) => day.map(() => true));
}

function eveningsOnly(): boolean[][] {
  const grid = emptyWeeklyGrid();
  for (let day = 0; day <= 6; day++) {
    for (let hour = 18; hour < 23; hour++) {
      grid[day][hour] = true;
    }
  }
  return grid;
}

export const SCHEDULE_FIXTURES: Schedule[] = [
  {
    id: 'sch1',
    name: 'Office Lighting — Weekdays',
    buildingId: 'b1',
    deviceIds: ['d11', 'd12'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch2',
    name: 'Gateway Always-On',
    buildingId: 'b1',
    deviceIds: ['d13'],
    weeklyGrid: alwaysOn(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch3',
    name: 'Open Office 2A — Evening Lighting',
    buildingId: 'b2',
    deviceIds: ['d16'],
    weeklyGrid: eveningsOnly(),
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'paused',
  },
  {
    id: 'sch4',
    name: 'Manager Room — Business Hours',
    buildingId: 'b1',
    deviceIds: ['d42', 'd43'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch5',
    name: 'Manager Room — Evening Motion Monitoring',
    buildingId: 'b1',
    deviceIds: ['d46'],
    weeklyGrid: eveningsOnly(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch6',
    name: 'Retail Suite A — Storefront Lighting',
    buildingId: 'b1',
    deviceIds: ['d21'],
    weeklyGrid: eveningsOnly(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch7',
    name: 'Open Office 3A — Weekday Lighting',
    buildingId: 'b1',
    deviceIds: ['d27'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch8',
    name: 'Reception — Business Hours Lighting',
    buildingId: 'b2',
    deviceIds: ['d30'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch9',
    name: 'Lab 1 — Ventilation Schedule',
    buildingId: 'b2',
    deviceIds: ['d32'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
  {
    id: 'sch10',
    name: 'Lab 1 — Weekday Lighting',
    buildingId: 'b2',
    deviceIds: ['d83'],
    weeklyGrid: businessHours(),
    endDate: null,
    status: 'active',
  },
];
