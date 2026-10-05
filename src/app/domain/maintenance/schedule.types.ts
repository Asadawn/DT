export interface Schedule {
  id: string;
  name: string;
  buildingId: string;
  deviceIds: string[];
  weeklyGrid: boolean[][];
  endDate: string | null;
  status: 'active' | 'paused';
}

export interface NewScheduleInput {
  name: string;
  buildingId: string;
  deviceIds: string[];
  weeklyGrid: boolean[][];
  endDate: string | null;
}

export function emptyWeeklyGrid(): boolean[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
}
