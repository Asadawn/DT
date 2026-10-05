import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCpu, lucideShield, lucideUsers } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-room-stat-card',
  imports: [NgIcon, ...HlmCardImports],
  providers: [provideIcons({ lucideCpu, lucideUsers, lucideShield })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div hlmCard size="sm" class="h-full">
      <div hlmCardContent class="flex h-full gap-3">
        @if (icon(); as name) {
          <span
            class="bg-dashboard-accent/10 text-dashboard-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <ng-icon [name]="name" size="17" />
          </span>
        }

        <div class="flex flex-1 items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col">
            <h2 class="text-muted-foreground text-xs">{{ label() }}</h2>
            <div class="mt-2">
              <ng-content />
            </div>
          </div>

          <div class="shrink-0">
            <ng-content select="[header-action]" />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RoomStatCard {
  readonly icon = input<string | undefined>(undefined);
  readonly label = input.required<string>();
}
