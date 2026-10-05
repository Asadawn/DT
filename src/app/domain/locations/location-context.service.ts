import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BuildingService } from '../buildings/building.service';

export type LocationScopeLevel = 'building' | 'floor' | 'space';

const STORAGE_KEY = 'dt.location-scope';

interface StoredScope {
  buildingId: string | null;
  floorId: string | null;
  spaceId: string | null;
}

function readStoredScope(): StoredScope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { buildingId: null, floorId: null, spaceId: null };
    return JSON.parse(raw) as StoredScope;
  } catch {
    return { buildingId: null, floorId: null, spaceId: null };
  }
}

@Injectable({ providedIn: 'root' })
export class LocationContextService {
  private readonly buildingService = inject(BuildingService);
  private readonly stored = readStoredScope();

  readonly selectedBuildingId = signal<string | null>(this.stored.buildingId);
  readonly selectedFloorId = signal<string | null>(this.stored.floorId);
  readonly selectedSpaceId = signal<string | null>(this.stored.spaceId);

  readonly scopeLevel = computed<LocationScopeLevel>(() => {
    if (this.selectedSpaceId()) return 'space';
    if (this.selectedFloorId()) return 'floor';
    return 'building';
  });

  constructor() {
    effect(() => {
      const scope: StoredScope = {
        buildingId: this.selectedBuildingId(),
        floorId: this.selectedFloorId(),
        spaceId: this.selectedSpaceId(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
      } catch {}
    });

    effect(() => {
      const buildings = this.buildingService.buildings();
      if (buildings.length === 0) return;

      const currentlyValid = buildings.some((b) => b.id === this.selectedBuildingId());
      if (!currentlyValid) {
        this.selectedBuildingId.set(buildings[0].id);
      }
    });
  }

  selectBuilding(buildingId: string): void {
    this.selectedBuildingId.set(buildingId);
    this.selectedFloorId.set(null);
    this.selectedSpaceId.set(null);
  }

  selectFloor(floorId: string | null): void {
    this.selectedFloorId.set(floorId);
    this.selectedSpaceId.set(null);
  }

  selectSpace(spaceId: string | null): void {
    this.selectedSpaceId.set(spaceId);
  }
}
