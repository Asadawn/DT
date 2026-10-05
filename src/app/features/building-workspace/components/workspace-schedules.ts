import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Schedule } from '../../../domain/maintenance/schedule.types';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-workspace-schedules',
  imports: [RouterLink, DtStatusChip, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmCard size="sm">
      <div hlmCardContent>
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-xs">Schedules</h2>
          <a
            routerLink="/operations/schedules"
            class="text-dashboard-accent text-xs hover:underline"
            >View all →</a
          >
        </div>

        @if (schedules().length === 0) {
          <p class="text-muted-foreground text-xs">
            No schedules reference a device in this scope.
          </p>
        } @else {
          <ul class="divide-border flex flex-col divide-y">
            @for (schedule of schedules(); track schedule.id) {
              <li>
                <a
                  [routerLink]="['/operations/schedules', schedule.id]"
                  class="hover:bg-accent rounded-control -mx-2 flex items-center justify-between gap-3 px-2 py-2"
                >
                  <span class="truncate text-xs">{{ schedule.name }}</span>
                  <dt-status-chip [status]="schedule.status" weight="normal" />
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class WorkspaceSchedules {
  readonly schedules = input.required<Schedule[]>();
}
