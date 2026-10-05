import type { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import type { ButtonVariants } from '@spartan-ng/helm/button';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';
import { HlmPaginationLink } from './hlm-pagination-link';

@Component({
  selector: 'hlm-pagination-previous',
  imports: [HlmPaginationLink, NgIcon],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      hlmPaginationLink
      [class]="_computedClass()"
      [link]="link()"
      [queryParams]="queryParams()"
      [queryParamsHandling]="queryParamsHandling()"
      [size]="_size()"
      [attr.aria-label]="ariaLabel()"
    >
      <ng-icon name="lucideChevronLeft" class="rtl:rotate-180" />
      <span [class]="_labelClass()">{{ text() }}</span>
    </a>
  `,
})
export class HlmPaginationPrevious {
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  public readonly link = input<RouterLink['routerLink']>();
  public readonly queryParams = input<RouterLink['queryParams']>();
  public readonly queryParamsHandling = input<RouterLink['queryParamsHandling']>();

  public readonly ariaLabel = input<string>('Go to previous page', { alias: 'aria-label' });
  public readonly text = input<string>('Previous');
  public readonly iconOnly = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });
  protected readonly _labelClass = computed(() =>
    hlm(this.iconOnly() ? 'sr-only' : 'hidden sm:block'),
  );

  protected readonly _size = computed<ButtonVariants['size']>(() =>
    this.iconOnly() ? 'icon' : 'default',
  );

  protected readonly _computedClass = computed(() =>
    hlm(!this.iconOnly() && 'ps-2!', this.userClass()),
  );
}
