import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocationContextService } from '../../domain/locations/location-context.service';
import { DtSkeleton } from '../../shared/ui/state/skeleton';

@Component({
  selector: 'app-buildings-page',
  imports: [DtSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 p-4">
      @for (i of [1, 2, 3]; track i) {
        <div class="h-8"><dt-skeleton /></div>
      }
    </div>
  `,
})
export class BuildingsPage {
  private readonly router = inject(Router);
  private readonly locationContext = inject(LocationContextService);

  constructor() {
    effect(() => {
      const buildingId = this.locationContext.selectedBuildingId();
      if (buildingId) {
        this.router.navigate(['/buildings', buildingId], { replaceUrl: true });
      }
    });
  }
}
