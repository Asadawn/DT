import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'dt-section-shell',
  imports: [NgIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="border-border rounded-card-lg mb-6 border bg-white p-4 sm:p-5">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div class="flex items-start gap-2.5">
          @if (icon()) {
            <span
              class="bg-dashboard-accent/10 text-dashboard-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            >
              <ng-icon [name]="icon()!" size="16" />
            </span>
          }
          <div class="min-w-0">
            <h2 class="text-foreground text-base font-semibold">{{ title() }}</h2>
            @if (description()) {
              <p class="text-muted-foreground mt-0.5 text-xs">{{ description() }}</p>
            }
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          @if (scope()) {
            <span
              class="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
              >{{ scope() }}</span
            >
          }
          @if (viewAllLink()) {
            <a
              [routerLink]="viewAllLink()"
              class="text-dashboard-accent text-xs font-medium hover:underline"
              >View All</a
            >
          }
          <ng-content select="[header-action]" />
        </div>
      </div>
      <ng-content />
    </section>
  `,
})
export class DtSectionShell {
  readonly icon = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly viewAllLink = input<string | unknown[]>();
  readonly scope = input<string>();
}
