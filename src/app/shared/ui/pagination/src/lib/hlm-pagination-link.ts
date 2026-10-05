import type { BooleanInput } from '@angular/cdk/coercion';
import { Directive, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buttonVariants, type ButtonVariants } from '@spartan-ng/helm/button';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmPaginationLink]',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: [
        'target',
        'queryParams',
        'fragment',
        'queryParamsHandling',
        'state',
        'info',
        'relativeTo',
        'preserveFragment',
        'skipLocationChange',
        'replaceUrl',
        'routerLink: link',
      ],
    },
  ],
  host: {
    'data-slot': 'pagination-link',
    '[attr.data-active]': 'isActive() ? "true" : null',
    '[attr.aria-current]': 'isActive() ? "page" : null',
  },
})
export class HlmPaginationLink {
  public readonly isActive = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
  public readonly size = input<ButtonVariants['size']>('icon');
  public readonly link = input<RouterLink['routerLink']>();

  constructor() {
    classes(() => [
      'relative',
      buttonVariants({
        variant: 'ghost',
        size: this.size(),
      }),
      this.isActive()
        ? 'bg-primary/20! hover:bg-primary/25!'
        : 'hover:bg-primary/10! hover:text-foreground! aria-expanded:bg-primary/10! aria-expanded:text-foreground!',
      this.link() === undefined && 'cursor-pointer',
    ]);
  }
}
