import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { VendorInvitationStatus, VendorJobStatus } from '../../../domain/vendors/vendor.types';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

export interface WorkspaceVendorEntry {
  invitationId: string;
  vendorName: string;
  status: VendorInvitationStatus;
  jobStatus?: VendorJobStatus;
  maintenanceId: string;
  maintenanceTitle: string;
}

@Component({
  selector: 'app-workspace-vendor-activity',
  imports: [RouterLink, DtStatusChip, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (entries().length > 0) {
      <div hlmCard size="sm">
        <div hlmCardContent>
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-xs">Vendors</h2>
            <a
              routerLink="/operations/vendors"
              class="text-dashboard-accent text-xs hover:underline"
              >View all →</a
            >
          </div>
          <ul class="divide-border flex flex-col divide-y">
            @for (entry of entries(); track entry.invitationId) {
              <li>
                <a
                  [routerLink]="['/operations/maintenance', entry.maintenanceId]"
                  class="hover:bg-accent rounded-control -mx-2 flex items-center justify-between gap-3 px-2 py-2"
                >
                  <div class="min-w-0">
                    <div class="truncate text-xs">{{ entry.vendorName }}</div>
                    <div class="text-muted-foreground truncate text-xs">
                      {{ entry.maintenanceTitle }}
                    </div>
                  </div>
                  <dt-status-chip [status]="entry.jobStatus ?? entry.status" weight="normal" />
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
})
export class WorkspaceVendorActivity {
  readonly entries = input.required<WorkspaceVendorEntry[]>();
}
