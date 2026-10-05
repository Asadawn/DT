export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  timezone: string;
  floorCount: number;
  imageColor: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  level: number;
}

export type SpaceKind = 'office' | 'meeting-room' | 'common-area' | 'mechanical' | 'retail';

export interface Space {
  id: string;
  floorId: string;
  buildingId: string;
  name: string;
  kind: SpaceKind;
}

export interface NewSpaceInput {
  name: string;
  buildingId: string;
  floorId: string;
  kind: SpaceKind;
}
