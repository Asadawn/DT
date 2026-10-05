import { Injectable, resource, signal } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { BUILDING_FIXTURES, FLOOR_FIXTURES, SPACE_FIXTURES } from './building.fixtures';
import type { Building, Floor, NewSpaceInput, Space } from './building.types';

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly buildingsResource = resource({
    defaultValue: [] as Building[],
    loader: async () => {
      await simulateLatency();
      return BUILDING_FIXTURES;
    },
  });

  readonly buildings = this.buildingsResource.value;
  readonly buildingsLoading = this.buildingsResource.isLoading;
  readonly buildingsError = this.buildingsResource.error;

  private readonly floorsSignal = signal<Floor[]>(FLOOR_FIXTURES);
  private readonly spacesSignal = signal<Space[]>(SPACE_FIXTURES);

  building(buildingId: string | null | undefined): Building | undefined {
    if (!buildingId) return undefined;
    return this.buildings().find((b) => b.id === buildingId);
  }

  floorsForBuilding(buildingId: string): Floor[] {
    return this.floorsSignal()
      .filter((f) => f.buildingId === buildingId)
      .sort((a, b) => a.level - b.level);
  }

  floor(floorId: string | null | undefined): Floor | undefined {
    if (!floorId) return undefined;
    return this.floorsSignal().find((f) => f.id === floorId);
  }

  spacesForFloor(floorId: string): Space[] {
    return this.spacesSignal().filter((s) => s.floorId === floorId);
  }

  spacesForBuilding(buildingId: string): Space[] {
    return this.spacesSignal().filter((s) => s.buildingId === buildingId);
  }

  space(spaceId: string | null | undefined): Space | undefined {
    if (!spaceId) return undefined;
    return this.spacesSignal().find((s) => s.id === spaceId);
  }

  async createSpace(input: NewSpaceInput): Promise<Space> {
    await simulateLatency(400);
    const created: Space = { id: `sp${Date.now().toString(36)}`, ...input };
    this.spacesSignal.update((list) => [...list, created]);
    return created;
  }
}
