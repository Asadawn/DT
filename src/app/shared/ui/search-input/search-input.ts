import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmInputImports } from '@spartan-ng/helm/input';

@Component({
  selector: 'dt-search-input',
  imports: [NgIcon, ...HlmInputImports],
  providers: [provideIcons({ lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="relative block">
      <span class="sr-only">{{ placeholder() }}</span>
      <ng-icon
        name="lucideSearch"
        [size]="size() === 'sm' ? '13' : '15'"
        class="text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2"
        [class]="size() === 'sm' ? 'left-2' : 'left-2.5'"
      />
      <!-- appearance-none: resets input[type=search]'s native WebKit
           "searchfield" chrome (harmless, kept for general hygiene — see
           the size()==='sm' branch below for the fix that actually
           resolved the reported rendering glitch). -->
      <input
        hlmInput
        type="search"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
        class="w-full appearance-none pl-8"
        [class]="
          size() === 'sm'
            ? 'h-7! py-0.5! pl-7! text-xs! focus-visible:shadow-none! focus-visible:ring-2! focus-visible:ring-dashboard-accent/70! focus-visible:border-dashboard-accent!'
            : ''
        "
      />
    </label>
  `,
})
export class DtSearchInput {
  readonly placeholder = input('Search…');
  readonly value = model('');
  readonly size = input<'default' | 'sm'>('default');
}
