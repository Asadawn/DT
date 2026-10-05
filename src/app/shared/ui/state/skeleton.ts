import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dt-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="bg-muted block animate-pulse" [class]="roundedClass()"></span>`,
  host: { '[style.display]': "'block'" },
})
export class DtSkeleton {
  readonly rounded = input<'sm' | 'full'>('sm');

  protected roundedClass(): string {
    return this.rounded() === 'full' ? 'rounded-full h-full w-full' : 'rounded-control h-full w-full';
  }
}
