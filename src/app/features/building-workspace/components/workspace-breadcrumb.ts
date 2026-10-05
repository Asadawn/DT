import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideHouse } from '@ng-icons/lucide';
import { BuildingService } from '../../../domain/buildings/building.service';
import { BuildingWorkspaceStateService } from '../building-workspace-state.service';

interface Crumb {
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-workspace-breadcrumb',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronRight, lucideHouse })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav
      class="text-muted-foreground bg-white/95 shadow-md rounded-control border-border flex items-center gap-1 border px-3 py-1.5 text-xs backdrop-blur-sm"
    >
      <ng-icon name="lucideHouse" size="12" class="shrink-0" />
      @for (crumb of crumbs(); track $index; let last = $last) {
        <ng-icon name="lucideChevronRight" size="12" class="text-muted-foreground/60 shrink-0" />
        <button
          type="button"
          class="hover:text-foreground cursor-pointer transition-colors hover:underline"
          [class.text-foreground]="last"
          (click)="crumb.action()"
        >
          {{ crumb.label }}
        </button>
      }
    </nav>
  `,
})
export class WorkspaceBreadcrumb {
  private readonly buildingService = inject(BuildingService);
  private readonly workspace = inject(BuildingWorkspaceStateService);

  readonly buildingId = input.required<string>();

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));

  protected readonly crumbs = computed<Crumb[]>(() => {
    const building = this.building();
    const context = this.workspace.spatialContext();
    const list: Crumb[] = [
      { label: building?.name ?? '…', action: () => this.workspace.enterBuilding() },
    ];

    if (context.floorId) {
      const floor = this.buildingService.floor(context.floorId);
      if (floor)
        list.push({ label: floor.name, action: () => this.workspace.enterFloor(floor.id) });
    }
    if (context.spaceId) {
      const space = this.buildingService.space(context.spaceId);
      if (space)
        list.push({
          label: space.name,
          action: () => this.workspace.enterSpace(space.floorId, space.id),
        });
    }
    return list;
  });
}
