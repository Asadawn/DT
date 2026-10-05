import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideHouse } from '@ng-icons/lucide';

export interface BreadcrumbLink {
  label: string;
  link: string | unknown[];
}
export type BreadcrumbItem = string | BreadcrumbLink;

@Component({
  selector: 'dt-page-header',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideChevronRight, lucideHouse })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly breadcrumb = input<BreadcrumbItem[]>([]);
  readonly icon = input<string | undefined>(undefined);
  readonly descriptionIcon = input<string | undefined>(undefined);

  protected isLink(crumb: BreadcrumbItem): crumb is BreadcrumbLink {
    return typeof crumb !== 'string';
  }
}
