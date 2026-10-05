import { Injectable, signal } from '@angular/core';

export type SpatialObjectType = 'building' | 'floor' | 'space' | 'device' | 'automation';

export interface SpatialSelection {
  type: SpatialObjectType;
  id: string;
}

interface SpatialContext {
  floorId: string | null;
  spaceId: string | null;
}

@Injectable({ providedIn: 'root' })
export class BuildingWorkspaceStateService {
  readonly activeBuildingId = signal<string | null>(null);
  readonly spatialContext = signal<SpatialContext>({ floorId: null, spaceId: null });
  readonly selectedObject = signal<SpatialSelection | null>(null);

  select(selection: SpatialSelection): void {
    this.selectedObject.set(selection);
  }

  selectDevice(deviceId: string): void {
    this.select({ type: 'device', id: deviceId });
  }

  selectAutomation(automationId: string): void {
    this.select({ type: 'automation', id: automationId });
  }

  enterFloor(floorId: string): void {
    this.spatialContext.set({ floorId, spaceId: null });
    this.selectedObject.set({ type: 'floor', id: floorId });
  }

  enterSpace(floorId: string, spaceId: string): void {
    this.spatialContext.set({ floorId, spaceId });
    this.selectedObject.set({ type: 'space', id: spaceId });
  }

  enterBuilding(): void {
    this.spatialContext.set({ floorId: null, spaceId: null });
    this.selectedObject.set({ type: 'building', id: this.activeBuildingId() ?? '' });
  }

  resetForBuilding(buildingId: string): void {
    this.activeBuildingId.set(buildingId);
    this.spatialContext.set({ floorId: null, spaceId: null });
    this.selectedObject.set({ type: 'building', id: buildingId });
  }
}
