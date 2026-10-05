import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { BuildingService } from '../../domain/buildings/building.service';
import { DtSkeleton } from '../../shared/ui/state/skeleton';
import { DtEmptyState } from '../../shared/ui/state/empty-state';

@Component({
  selector: 'app-global-space-detail-page',
  imports: [DtSkeleton, DtEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (space(); as s) {
      <div class="flex flex-col gap-2 p-4">
        @for (i of [1, 2, 3]; track i) {
          <div class="h-8"><dt-skeleton /></div>
        }
      </div>
    } @else {
      <dt-empty-state icon="▭" title="Space not found" />
    }
  `,
})
export class GlobalSpaceDetailPage {
  readonly spaceId = input.required<string>();

  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);

  protected readonly space = computed(() => this.buildingService.space(this.spaceId()));

  constructor() {
    effect(() => {
      const space = this.space();
      if (space) {
        this.router.navigate(
          ['/buildings', space.buildingId, 'floors', space.floorId, 'spaces', space.id],
          {
            replaceUrl: true,
          },
        );
      }
    });
  }
}
