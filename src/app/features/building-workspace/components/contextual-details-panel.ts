import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideLayoutDashboard,
  lucideZap,
} from '@ng-icons/lucide';
import { AccessAssignmentService } from '../../../domain/access/access-assignment.service';
import { AutomationService } from '../../../domain/automations/automation.service';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { DtDeviceQuickView } from '../../../shared/ui/device/device-quick-view';
import { MaintenanceService } from '../../../domain/maintenance/maintenance.service';
import { ScheduleService } from '../../../domain/maintenance/schedule.service';
import type { DeviceConnectivityStatus } from '../../../shared/types/canonical.types';
import { VendorService } from '../../../domain/vendors/vendor.service';
import { RoomAssignedTo } from '../../buildings/components/room-assigned-to';
import { RoomMaintenance } from '../../buildings/components/room-maintenance';
import { AutomationDetailsCard } from './automation-details-card';
import { QuickInteractions } from './quick-interactions';
import { SpaceDeviceControls } from './space-device-controls';
import { WorkspaceHousekeeping } from './workspace-housekeeping';
import { WorkspaceSchedules } from './workspace-schedules';
import { WorkspaceVendorActivity, type WorkspaceVendorEntry } from './workspace-vendor-activity';
import { BuildingWorkspaceStateService } from '../building-workspace-state.service';

@Component({
  selector: 'app-contextual-details-panel',
  imports: [
    RouterLink,
    NgIcon,
    NgTemplateOutlet,
    ...HlmCardImports,
    ...HlmTabsImports,
    DtDeviceQuickView,
    AutomationDetailsCard,
    QuickInteractions,
    SpaceDeviceControls,
    RoomMaintenance,
    RoomAssignedTo,
    WorkspaceSchedules,
    WorkspaceHousekeeping,
    WorkspaceVendorActivity,
  ],
  providers: [
    provideIcons({ lucideArrowLeft, lucideArrowRight, lucideLayoutDashboard, lucideZap }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block p-3 pr-px' },
  template: `
    <div hlmCard size="sm">
      <div hlmCardContent>
        @if (selected()?.type === 'building' || selected()?.type === 'space') {
          <!-- Topbar (on request) — a header bar attached to the card's own
               top edge, not just inline body content: negative left/top/right
               margins cancel hlmCardContent's own padding (size="sm" ->
               spacing(4), i.e. 1rem, matching -m-4/p-4 exactly) for this one
               element so it spans edge-to-edge, then restores its own
               padding. Building scope only at first; extended to Space
               scope too on request ("also i want to show this at space
               level too") — Floor/Device/Automation selection still don't
               show it. The subtitle is scope-aware (liveOperationsSubtitle())
               rather than always saying "your building," which would be a
               real inaccuracy while looking at one room. -->
          <div class="-mx-4 -mt-4 mb-4 border-b border-border bg-white px-4 py-3.5">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span
                  class="bg-dashboard-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                ></span>
                <span class="bg-dashboard-accent relative inline-flex h-2 w-2 rounded-full"></span>
              </span>
              <h2 class="text-sm tracking-tight">Live Operations</h2>
            </div>
            <p class="text-muted-foreground mt-0.5 text-xs">{{ liveOperationsSubtitle() }}</p>
          </div>
        }

        <div #panelRegion tabindex="-1" class="outline-none">
          @switch (selected()?.type) {
            @case ('building') {
              @if (building()) {
                <div class="flex flex-col gap-4">
                  <ng-container [ngTemplateOutlet]="tabbedContent" />
                </div>
              }
            }
            @case ('floor') {
              @if (floor(); as f) {
                <div class="flex flex-col gap-4">
                  <ng-container [ngTemplateOutlet]="tabbedContent" />

                  <a
                    [routerLink]="['/buildings', f.buildingId, 'floors', f.id]"
                    class="bg-dashboard-accent/10 hover:bg-dashboard-accent/15 text-dashboard-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs transition-colors"
                  >
                    <ng-icon name="lucideLayoutDashboard" size="16" />
                    Open Full Floor Page
                    <ng-icon name="lucideArrowRight" size="16" />
                  </a>
                </div>
              }
            }
            @case ('space') {
              @if (space(); as s) {
                <div class="flex flex-col gap-4">
                  <ng-container [ngTemplateOutlet]="tabbedContent" />

                  <a
                    [routerLink]="['/buildings', s.buildingId, 'floors', s.floorId, 'spaces', s.id]"
                    class="bg-dashboard-accent/10 hover:bg-dashboard-accent/15 text-dashboard-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs transition-colors"
                  >
                    <ng-icon name="lucideLayoutDashboard" size="16" />
                    Open Full Room Page
                    <ng-icon name="lucideArrowRight" size="16" />
                  </a>
                </div>
              }
            }
            @case ('device') {
              @if (selectedDevice(); as d) {
                <div class="flex flex-col gap-3">
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer items-center gap-1 text-xs"
                    (click)="backToSpatialContext()"
                  >
                    <ng-icon name="lucideArrowLeft" size="12" />
                    Back to {{ spatialContextLabel() }}
                  </button>
                  <!-- No separate "Open full Device page" link here (removed on
                 request — it duplicated DtDeviceQuickView's own "Open Full
                 Device Page" button, which every one of its category branches
                 already renders at its own bottom). -->
                  <dt-device-quick-view [device]="d" [breadcrumb]="deviceBreadcrumb()" />
                </div>
              }
            }
            @case ('automation') {
              @if (selectedAutomation(); as a) {
                <div class="flex flex-col gap-5">
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer items-center gap-1 text-xs"
                    (click)="backToSpatialContext()"
                  >
                    <ng-icon name="lucideArrowLeft" size="12" />
                    Back to {{ spatialContextLabel() }}
                  </button>
                  <app-automation-details-card [automation]="a" />
                  <a
                    [routerLink]="['/operations/automations', a.id]"
                    class="text-dashboard-accent flex items-center gap-1 text-xs hover:underline"
                  >
                    Open full Automation page
                    <ng-icon name="lucideArrowRight" size="12" />
                  </a>
                </div>
              }
            }
          }
        </div>
      </div>
    </div>

    <!-- Shared device-row list markup — the Space case's "Sensors" list
         (sensorSpaceDevices(), below) renders through this one template;
         it originally had a sibling "Devices" list too, removed once
         QuickInteractions started showing every controllable device as a
         real toggle right above (see that component's own doc comment)
         made a second plain-text listing of the same devices redundant. -->
    <ng-template #deviceRows let-devices>
      <ul class="flex flex-col gap-0.5 text-xs">
        @for (device of devices; track device.id) {
          <li>
            <button
              type="button"
              class="hover:bg-accent flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
              [title]="device.name + ' — ' + connectivityLabel(device.connectivity)"
              (click)="workspace.selectDevice(device.id)"
            >
              <span
                class="h-1.5 w-1.5 shrink-0 rounded-full"
                [class.bg-dashboard-accent]="device.connectivity === 'online'"
                [class.bg-dashboard-warning]="
                  device.connectivity === 'warning' || device.connectivity === 'stale'
                "
                [class.bg-dashboard-danger]="
                  device.connectivity === 'offline' || device.connectivity === 'error'
                "
              ></span>
              <span class="flex-1 truncate">{{ device.name }}</span>
              <span class="sr-only">— {{ connectivityLabel(device.connectivity) }}</span>
            </button>
          </li>
        }
      </ul>
    </ng-template>
      
    <ng-template #automationsList>
      @if (scopedAutomations().length > 0) {
        <div>
          <h3 class="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
            Automations
          </h3>
          <ul class="flex flex-col gap-0.5 text-xs">
            @for (automation of scopedAutomations(); track automation.id) {
              <li>
                <button
                  type="button"
                  class="hover:bg-accent flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
                  (click)="workspace.selectAutomation(automation.id)"
                >
                  <span
                    class="bg-dashboard-accent/10 text-dashboard-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  >
                    <ng-icon name="lucideZap" size="14" />
                  </span>
                  <span class="flex-1 truncate">{{ automation.name }}</span>
                  <span class="text-muted-foreground shrink-0 text-xs">{{
                    automation.status === 'enabled' ? 'Active' : 'Paused'
                  }}</span>
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </ng-template>

    <!-- Quick Interactions (spec §21) / Device Controls — self-manages its
         own empty state (§21.3), so this outlet is unconditional; both
         components render nothing when there's nothing eligible to show.
         Space scope gets the richer SpaceDeviceControls (on request — a
         per-device row with a real inline stepper for whichever writable
         numeric property a device has, not just a flat boolean-toggle
         list); Building/Floor keep the original capped QuickInteractions
         "fast path" (potentially dozens of devices across many rooms,
         where a per-device stepper row for every one would be too much). -->
    <ng-template #quickInteractions>
      @if (selected()?.type === 'space') {
        <app-space-device-controls [devices]="scopedDevices()" />
      } @else {
        <app-quick-interactions [devices]="scopedDevices()" [automations]="scopedAutomations()" />
      }
    </ng-template>

    <!-- Vendors, Temporary Access ("Assigned To"), and Maintenance +
         Housekeeping — on request, none of these are tab-gated: they render
         below the tabs unconditionally, regardless of which of
         Controls/Automations/Schedules is active. Schedules moved into its
         own tab instead (below) — replacing the previous "Maintenance" tab —
         so Maintenance itself moved down here alongside the other always-
         visible operational concerns. -->
    <ng-template #alwaysVisibleOperations>
      <app-room-maintenance [requests]="scopedMaintenanceRequests()" scopeLabel="location" />
      @if (scopedHousekeepingRequests().length > 0) {
        <app-workspace-housekeeping [requests]="scopedHousekeepingRequests()" />
      }
      <!-- WorkspaceVendorActivity hides its own card when empty, but its *host* element still sat in this flex-col gap-5 container either way — an empty-but-present flex child still contributes a gap-5 on each side, which read as one oversized gap (2-3x normal) whenever empty (the common case: most rooms have no vendor entries), reported as "too much space between Maintenances and Assigned To." Gating the element itself at this call site (not just its inner content) removes it from layout entirely when empty, so only genuinely-adjacent cards contribute a gap. -->
      @if (scopedVendorEntries().length > 0) {
        <app-workspace-vendor-activity [entries]="scopedVendorEntries()" />
      }
      <app-room-assigned-to [assignments]="scopedAccessAssignments()" [compact]="true" />
    </ng-template>

    <!-- Tabbed layout (on request) — Controls / Automations / Schedules
         (Schedules replaces the earlier "Maintenance" tab on request),
         shared across the Building/Floor/Space cases (each just adds its own
         "Open Full X Page" CTA after this outlet). Device/Automation
         drill-in stay untabbed — a single focused detail view has nothing to
         tab between. Maintenance/Housekeeping/Vendors/Assigned To render
         below the tabs, always visible regardless of the active tab (on
         request) — see the alwaysVisibleOperations template's own doc
         comment above. -->
    <ng-template #tabbedContent>
      <div hlmTabs [tab]="activeTab()" (tabActivated)="activeTab.set($any($event))">
        <div hlmTabsList class="w-full">
          <button [hlmTabsTrigger]="'controls'" class="flex-1 text-xs! data-active:bg-white!">
            Controls
          </button>
          <button [hlmTabsTrigger]="'automations'" class="flex-1 text-xs! data-active:bg-white!">
            Automations
          </button>
          <button [hlmTabsTrigger]="'schedules'" class="flex-1 text-xs! data-active:bg-white!">
            Schedules
          </button>
        </div>

        <div [hlmTabsContent]="'controls'" class="flex flex-col gap-5 pt-4">
          <ng-container [ngTemplateOutlet]="quickInteractions" />

          @if (selected()?.type === 'space') {
            @if (sensorSpaceDevices().length > 0) {
              <div>
                <h3 class="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
                  Sensors
                </h3>
                <ng-container
                  [ngTemplateOutlet]="deviceRows"
                  [ngTemplateOutletContext]="{ $implicit: sensorSpaceDevices() }"
                />
              </div>
            }
          }
        </div>

        <div [hlmTabsContent]="'automations'" class="flex flex-col gap-5 pt-4">
          <ng-container [ngTemplateOutlet]="automationsList" />
        </div>

        <div [hlmTabsContent]="'schedules'" class="flex flex-col gap-5 pt-4">
          <app-workspace-schedules [schedules]="scopedSchedules()" />
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-5">
        <ng-container [ngTemplateOutlet]="alwaysVisibleOperations" />
      </div>
    </ng-template>
  `,
})
export class ContextualDetailsPanel {
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly automationService = inject(AutomationService);
  private readonly accessAssignmentService = inject(AccessAssignmentService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly vendorService = inject(VendorService);
  protected readonly workspace = inject(BuildingWorkspaceStateService);

  protected readonly selected = this.workspace.selectedObject;

  protected readonly liveOperationsSubtitle = computed(() =>
    this.selected()?.type === 'space'
      ? 'Control, automate and monitor this room'
      : 'Control, automate and monitor your building',
  );

  protected readonly activeTab = signal<'controls' | 'automations' | 'schedules'>('controls');

  private readonly panelRegion = viewChild<ElementRef<HTMLElement>>('panelRegion');
  private isFirstSelection = true;

  constructor() {
    effect(() => {
      this.selected();
      untracked(() => {
        if (this.isFirstSelection) {
          this.isFirstSelection = false;
          return;
        }
        this.panelRegion()?.nativeElement.focus({ preventScroll: true });
      });
    });
  }

  protected readonly building = computed(() => {
    const sel = this.selected();
    return sel?.type === 'building' ? this.buildingService.building(sel.id) : undefined;
  });

  protected readonly selectedDevice = computed(() => {
    const sel = this.selected();
    return sel?.type === 'device' ? this.deviceService.device(sel.id) : undefined;
  });

  protected readonly selectedAutomation = computed(() => {
    const sel = this.selected();
    return sel?.type === 'automation' ? this.automationService.automation(sel.id) : undefined;
  });

  protected readonly deviceBreadcrumb = computed(() => {
    const device = this.selectedDevice();
    if (!device) return '';
    const parts = [
      this.buildingService.building(device.buildingId)?.name,
      device.floorId ? this.buildingService.floor(device.floorId)?.name : undefined,
      device.spaceId ? this.buildingService.space(device.spaceId)?.name : undefined,
    ].filter((part): part is string => !!part);
    return parts.join(' / ');
  });

  protected readonly spatialContextLabel = computed(() => {
    const ctx = this.workspace.spatialContext();
    if (ctx.spaceId) return this.buildingService.space(ctx.spaceId)?.name ?? 'Room';
    if (ctx.floorId) return this.buildingService.floor(ctx.floorId)?.name ?? 'Floor';
    return (
      this.buildingService.building(this.workspace.activeBuildingId() ?? '')?.name ?? 'Building'
    );
  });

  protected backToSpatialContext(): void {
    const ctx = this.workspace.spatialContext();
    if (ctx.floorId && ctx.spaceId) {
      this.workspace.enterSpace(ctx.floorId, ctx.spaceId);
    } else if (ctx.floorId) {
      this.workspace.enterFloor(ctx.floorId);
    } else {
      this.workspace.enterBuilding();
    }
  }

  protected readonly floor = computed(() => {
    const sel = this.selected();
    return sel?.type === 'floor' ? this.buildingService.floor(sel.id) : undefined;
  });

  protected readonly space = computed(() => {
    const sel = this.selected();
    return sel?.type === 'space' ? this.buildingService.space(sel.id) : undefined;
  });

  protected readonly scopedDevices = computed(() => {
    const sel = this.selected();
    if (!sel) return [];
    if (sel.type === 'building') return this.deviceService.filtered({ buildingId: sel.id });
    if (sel.type === 'floor') {
      const floor = this.floor();
      return floor
        ? this.deviceService.filtered({ buildingId: floor.buildingId, floorId: floor.id })
        : [];
    }
    const space = this.space();
    return space
      ? this.deviceService.filtered({ buildingId: space.buildingId, spaceId: space.id })
      : [];
  });

  protected readonly spaceDevices = this.scopedDevices;

  protected readonly sensorSpaceDevices = computed(() =>
    this.scopedDevices().filter((d) => !d.capabilities.commands),
  );

  protected readonly scopedMaintenanceRequests = computed(() => {
    const sel = this.selected();
    if (!sel) return [];
    if (sel.type === 'building')
      return this.maintenanceService.requests().filter((r) => r.buildingId === sel.id);
    if (sel.type === 'floor') {
      const floor = this.floor();
      return floor ? this.maintenanceService.requests().filter((r) => r.floorId === floor.id) : [];
    }
    if (sel.type === 'space') {
      const space = this.space();
      return space ? this.maintenanceService.requests().filter((r) => r.spaceId === space.id) : [];
    }
    return [];
  });

  protected readonly scopedHousekeepingRequests = computed(() =>
    this.scopedMaintenanceRequests().filter((r) => !!r.bookingId),
  );

  protected readonly scopedVendorEntries = computed<WorkspaceVendorEntry[]>(() => {
    const entries: WorkspaceVendorEntry[] = [];
    for (const request of this.scopedMaintenanceRequests()) {
      for (const invitation of this.vendorService.invitationsFor(request.id)) {
        entries.push({
          invitationId: invitation.id,
          vendorName: this.vendorService.vendor(invitation.vendorId)?.name ?? 'Unknown vendor',
          status: invitation.status,
          jobStatus: invitation.jobStatus,
          maintenanceId: request.id,
          maintenanceTitle: request.title,
        });
      }
    }
    return entries;
  });

  protected readonly scopedAccessAssignments = computed(() => {
    const sel = this.selected();
    if (!sel) return [];
    if (sel.type === 'building')
      return this.accessAssignmentService.assignments().filter((a) => a.buildingId === sel.id);
    if (sel.type === 'floor') {
      const floor = this.floor();
      return floor
        ? this.accessAssignmentService.assignments().filter((a) => a.floorId === floor.id)
        : [];
    }
    if (sel.type === 'space') {
      const space = this.space();
      return space
        ? this.accessAssignmentService.assignments().filter((a) => a.spaceId === space.id)
        : [];
    }
    return [];
  });

  protected readonly scopedSchedules = computed(() => {
    const deviceIds = new Set(this.scopedDevices().map((d) => d.id));
    if (deviceIds.size === 0) return [];
    return this.scheduleService
      .schedules()
      .filter((s) => s.deviceIds.some((id) => deviceIds.has(id)));
  });

  protected readonly scopedAutomations = computed(() => {
    const sel = this.selected();
    if (!sel) return [];
    if (sel.type === 'building') {
      return this.automationService.automations().filter((a) => a.buildingId === sel.id);
    }
    if (sel.type === 'floor') {
      const floor = this.floor();
      return floor
        ? this.automationService.automations().filter((a) => a.floorId === floor.id)
        : [];
    }
    if (sel.type === 'space') {
      const space = this.space();
      return space
        ? this.automationService.automations().filter((a) => a.spaceId === space.id)
        : [];
    }
    return [];
  });

  protected connectivityLabel(status: DeviceConnectivityStatus): string {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'stale':
        return 'Stale';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'disabled':
        return 'Disabled';
      default:
        return 'Unknown';
    }
  }
}
