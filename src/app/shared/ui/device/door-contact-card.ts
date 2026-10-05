import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDoorOpen } from '@ng-icons/lucide';
import { contactEventsFor } from '../../../domain/devices/contact-event.fixtures';
import type { Device } from '../../../domain/devices/device.types';
import { ScheduleService } from '../../../domain/maintenance/schedule.service';
import { DtStatusChip } from '../badge/status-chip';

@Component({
  selector: 'dt-door-contact-card',
  imports: [DatePipe, RouterLink, NgIcon, DtStatusChip],
  providers: [provideIcons({ lucideDoorOpen })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-0">
      <!-- Header -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <span
            class="bg-dashboard-accent/10 text-dashboard-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <ng-icon name="lucideDoorOpen" size="17" />
          </span>
          <div>
            <h3 class="text-sm">{{ device().name }}</h3>
            <p class="text-muted-foreground text-xs">Event-based</p>
          </div>
        </div>
        <dt-status-chip [status]="device().connectivity" />
      </div>

      <!-- Current state badge -->
      <div class="mb-3">
        @if (currentState(); as state) {
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
            [class]="
              state === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'
            "
            >{{ state }}</span
          >
        }
      </div>

      <!-- Event timeline -->
      @if (events().length === 0) {
        <p class="text-muted-foreground text-xs">No events recorded yet.</p>
      } @else {
        <ul class="flex flex-col">
          @for (event of events(); track event.id; let last = $last) {
            <li class="relative flex gap-3 pl-5 py-1.5">
              <!-- Vertical connecting line -->
              @if (!last) {
                <span class="absolute left-[7px] top-5 bottom-0 w-px bg-border"></span>
              }
              <!-- Dot -->
              <span
                class="absolute left-0 top-3 h-3.5 w-3.5 rounded-full border-2 border-background"
                [class]="event.state === 'open' ? 'bg-amber-400' : 'bg-muted-foreground/40'"
              ></span>
              <!-- Content -->
              <div>
                <div class="text-sm font-medium capitalize">
                  {{ event.state === 'open' ? 'Opened' : 'Closed' }}
                </div>
                <div class="text-muted-foreground text-xs">
                  {{ event.at | date: 'MMM d, h:mm a' }}
                </div>
              </div>
            </li>
          }
        </ul>
      }

      <!-- Divider -->
      <div class="border-border my-3 border-t border-dashed"></div>

      <!-- Monitoring footer -->
      <div>
        <p class="text-muted-foreground mb-0.5 text-[10px] font-semibold uppercase tracking-widest">
          Monitoring
        </p>
        <p class="text-sm">Always armed</p>
      </div>

      <!-- Schedule — purely data-driven, same as DtDeviceCard/DtDeviceQuickView -->
      @if (schedules().length > 0) {
        <div class="border-border mt-3 border-t border-dashed pt-3">
          <p class="text-muted-foreground mb-1 text-[10px] font-semibold tracking-widest uppercase">
            Schedule
          </p>
          <ul class="flex flex-col gap-1">
            @for (schedule of schedules(); track schedule.id) {
              <li>
                <a
                  [routerLink]="['/operations/schedules', schedule.id]"
                  class="hover:bg-accent -mx-1.5 flex items-center justify-between rounded px-1.5 py-1"
                >
                  <span class="text-sm">{{ schedule.name }}</span>
                  <dt-status-chip [status]="schedule.status" />
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class DtDoorContactCard {
  readonly device = input.required<Device>();

  private readonly scheduleService = inject(ScheduleService);

  protected readonly events = computed(() => contactEventsFor(this.device().id));

  protected readonly currentState = computed(() => {
    const stateProperty = this.device().properties.find((p) => p.key === 'state');
    return typeof stateProperty?.value === 'string' ? stateProperty.value : null;
  });

  protected readonly schedules = computed(() =>
    this.scheduleService.schedulesForDevice(this.device().id),
  );
}
