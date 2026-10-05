import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MaintenanceRequest } from '../../../domain/maintenance/maintenance.types';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-workspace-housekeeping',
  imports: [RouterLink, DatePipe, DtStatusChip, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (requests().length > 0) {
      <div hlmCard size="sm">
        <div hlmCardContent>
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-xs">Housekeeping</h2>
            <a
              routerLink="/operations/maintenance"
              class="text-dashboard-accent text-xs hover:underline"
              >View all →</a
            >
          </div>
          <ul class="divide-border flex flex-col divide-y">
            @for (request of requests(); track request.id) {
              <li>
                <a
                  [routerLink]="['/operations/maintenance', request.id]"
                  class="hover:bg-accent rounded-control -mx-2 flex items-center justify-between gap-3 px-2 py-2"
                >
                  <div class="min-w-0">
                    <div class="truncate text-xs">{{ request.title }}</div>
                    <div class="text-muted-foreground truncate text-xs">
                      {{ request.assignee ?? 'Unassigned' }} · updated
                      {{ request.updatedAt | date: 'short' }}
                    </div>
                  </div>
                  <dt-status-chip [status]="request.status" weight="normal" />
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
})
export class WorkspaceHousekeeping {
  readonly requests = input.required<MaintenanceRequest[]>();
}
