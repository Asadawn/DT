import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface TimelineEntry {
  id: string;
  label: string;
  at: string;
  actor?: string;
}

@Component({
  selector: 'dt-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="flex flex-col gap-4">
      @for (entry of entries(); track entry.id) {
        <li class="flex gap-3">
          <div class="flex flex-col items-center">
            <span class="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full"></span>
            <span class="bg-border mt-1 w-px flex-1"></span>
          </div>
          <div class="pb-1">
            <p class="text-sm">{{ entry.label }}</p>
            <p class="text-muted-foreground text-xs">
              {{ entry.at | date: 'medium' }}
              @if (entry.actor) {
                · {{ entry.actor }}
              }
            </p>
          </div>
        </li>
      }
    </ol>
  `,
  imports: [DatePipe],
})
export class DtTimeline {
  readonly entries = input.required<TimelineEntry[]>();
}
