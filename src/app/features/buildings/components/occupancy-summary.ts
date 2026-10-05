import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { OccupancyService } from '../../../domain/occupancy/occupancy.service';
import type { Space } from '../../../domain/buildings/building.types';
import type { LocationRef } from '../../../shared/types/canonical.types';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-occupancy-summary',
  imports: [RouterLink, NgIcon, DtStatusChip, ...HlmCardImports],
  providers: [provideIcons({ lucideUsers })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './occupancy-summary.html',
})
export class OccupancySummary {
  readonly spaces = input.required<Space[]>();
  readonly scopeLabel = input<'floor' | 'building'>('floor');

  private readonly occupancyService = inject(OccupancyService);

  protected readonly rows = computed(() =>
    this.spaces().map((space) => {
      const location: LocationRef = {
        buildingId: space.buildingId,
        floorId: space.floorId,
        spaceId: space.id,
      };
      return { space, reading: this.occupancyService.reading(location) };
    }),
  );

  protected readonly counts = computed(() =>
    this.occupancyService.rollup(this.rows().map((r) => r.reading)),
  );

  protected readonly occupiedRows = computed(() => {
    const statuses: string[] =
      this.scopeLabel() === 'building' ? ['occupied', 'reserved'] : ['occupied'];
    return this.rows().filter((r) => statuses.includes(r.reading.status));
  });

  protected readonly occupiedPercent = computed(() => {
    const { occupied, total } = this.counts();
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  });

  protected readonly reservedPercent = computed(() => {
    const { reserved, total } = this.counts();
    return total > 0 ? Math.round((reserved / total) * 100) : 0;
  });
}
