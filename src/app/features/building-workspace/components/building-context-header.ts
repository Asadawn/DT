import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBuilding2, lucideMapPin } from '@ng-icons/lucide';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { TopbarContentService } from '../../../shared/layout/topbar/topbar-content.service';
import type { SelectOption } from '../../../shared/types/canonical.types';
import { mediaQuerySignal } from '../../../shared/utils/media-query.signal';
import { selectOptionLabelFn } from '../../../shared/utils/select-option-label';
import { BuildingWorkspaceStateService } from '../building-workspace-state.service';

@Component({
  selector: 'app-building-context-header',
  imports: [NgIcon, ...HlmSelectImports],
  providers: [provideIcons({ lucideBuilding2, lucideMapPin })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <ng-template #topbarSlot>
      <!-- 3-part row (on request) — identity pinned left, dropdowns
           centered in the row: flanking columns are equal fractions so the
           auto-sized center column sits exactly in the middle,
           independent of the identity block's own (variable) width. -->
      <div class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div class="min-w-0">
          @if (!isNarrow() && building(); as b) {
            <div class="flex min-w-0 items-center gap-2.5">
              <span
                class="bg-dashboard-accent/10 text-dashboard-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              >
                <ng-icon name="lucideBuilding2" size="15" />
              </span>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h1 class="text-sm tracking-tight">{{ b.name }}</h1>
                  @if (onlineDeviceCount() > 0) {
                    <span
                      class="bg-dashboard-accent/10 text-dashboard-accent inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]"
                      title="At least one device in this building is reporting online right now"
                    >
                      <span class="relative flex h-1.5 w-1.5">
                        <span
                          class="bg-dashboard-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                        ></span>
                        <span
                          class="bg-dashboard-accent relative inline-flex h-1.5 w-1.5 rounded-full"
                        ></span>
                      </span>
                      Live
                    </span>
                  }
                </div>
                <p class="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <ng-icon name="lucideMapPin" size="10" class="shrink-0" />
                  <span class="truncate">{{ b.address }}</span>
                </p>
              </div>
            </div>
          }
        </div>

        <div class="flex items-center gap-2.5">
          <hlm-select
            [value]="buildingId()"
            [itemToString]="buildingLabel"
            (valueChange)="onBuildingChange($any($event))"
          >
            <hlm-select-trigger class="h-8 w-36 text-xs"
              ><hlm-select-value placeholder="Select building"
            /></hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              @for (option of buildingOptions(); track option.value) {
                <hlm-select-item [value]="option.value">{{ option.label }}</hlm-select-item>
              }
            </hlm-select-content>
          </hlm-select>

          <hlm-select
            [value]="floorId()"
            [itemToString]="floorLabel"
            (valueChange)="onFloorChange($any($event))"
          >
            <hlm-select-trigger class="h-8 w-32 text-xs"
              ><hlm-select-value placeholder="All floors"
            /></hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              @for (option of floorOptions(); track option.value) {
                <hlm-select-item [value]="option.value">{{ option.label }}</hlm-select-item>
              }
            </hlm-select-content>
          </hlm-select>

          <hlm-select
            [value]="spaceId()"
            [itemToString]="spaceLabel"
            [disabled]="!floorId()"
            (valueChange)="onSpaceChange($any($event))"
          >
            <hlm-select-trigger class="h-8 w-32 text-xs"
              ><hlm-select-value placeholder="All spaces"
            /></hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              @for (option of spaceOptions(); track option.value) {
                <hlm-select-item [value]="option.value">{{ option.label }}</hlm-select-item>
              }
            </hlm-select-content>
          </hlm-select>
        </div>

        <div></div>
      </div>
    </ng-template>
  `,
})
export class BuildingContextHeader {
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly workspace = inject(BuildingWorkspaceStateService);
  private readonly router = inject(Router);
  private readonly topbarContent = inject(TopbarContentService);

  readonly buildingId = input.required<string>();

  private readonly topbarSlot = viewChild.required<TemplateRef<unknown>>('topbarSlot');

  protected readonly isNarrow = mediaQuerySignal('(max-width: 768px)', inject(DestroyRef));

  constructor() {
    effect(() => {
      this.topbarContent.set(this.topbarSlot());
    });
    inject(DestroyRef).onDestroy(() => this.topbarContent.clear(this.topbarSlot()));
  }

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));

  protected readonly onlineDeviceCount = computed(
    () =>
      this.deviceService
        .filtered({ buildingId: this.buildingId() })
        .filter((d) => d.connectivity === 'online').length,
  );

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.buildingService
      .floorsForBuilding(this.buildingId())
      .map((f) => ({ value: f.id, label: f.name })),
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);
  protected readonly floorId = computed(() => this.workspace.spatialContext().floorId ?? '');

  protected readonly spaceOptions = computed<SelectOption[]>(() => {
    const floorId = this.workspace.spatialContext().floorId;
    return floorId
      ? this.buildingService.spacesForFloor(floorId).map((s) => ({ value: s.id, label: s.name }))
      : [];
  });
  protected readonly spaceLabel = selectOptionLabelFn(this.spaceOptions);
  protected readonly spaceId = computed(() => this.workspace.spatialContext().spaceId ?? '');

  protected onBuildingChange(value: string | null | undefined): void {
    const id = value ?? '';
    if (!id || id === this.buildingId()) return;
    this.router.navigate(['/buildings', id]);
  }

  protected onFloorChange(value: string | null | undefined): void {
    const id = value ?? '';
    if (id) this.workspace.enterFloor(id);
    else this.workspace.enterBuilding();
  }

  protected onSpaceChange(value: string | null | undefined): void {
    const id = value ?? '';
    const floorId = this.workspace.spatialContext().floorId;
    if (id && floorId) this.workspace.enterSpace(floorId, id);
    else if (floorId) this.workspace.enterFloor(floorId);
  }
}
