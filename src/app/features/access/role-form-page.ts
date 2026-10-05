import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import type { PermissionAction } from '../../core/permissions/permission.service';
import { PERMISSION_RESOURCES } from '../../domain/access/access.types';
import { RoleService } from '../../domain/access/role.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { statusLabel } from '../../shared/utils/status-tone';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

const RESOURCE_LABELS: Partial<Record<(typeof PERMISSION_RESOURCES)[number], string>> = {
  'access-assignments': 'Temporary Access',
};

interface RoleFormModel {
  name: string;
  description: string;
}

interface MatrixRow {
  id: string;
  resource: string;
  label: string;
}

@Component({
  selector: 'app-role-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    DtCellTemplate,
    DtDataTable,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmCheckboxImports,
    ...HlmInputImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-form-page.html',
})
export class RoleFormPage {
  readonly roleId = input<string>();

  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  protected readonly resources = PERMISSION_RESOURCES;
  protected readonly actions = ACTIONS;

  protected readonly matrixRows: MatrixRow[] = this.resources.map((resource) => ({
    id: resource,
    resource,
    label: this.resourceLabel(resource),
  }));

  protected readonly matrixColumns: DtTableColumn<MatrixRow>[] = [
    {
      id: 'resource',
      label: 'Resource',
      priority: 1,
      align: 'start',
      accessor: (row) => row.label,
    },
    ...ACTIONS.map((action) => ({
      id: action,
      label: action.charAt(0).toUpperCase() + action.slice(1),
      priority: 1 as const,
      align: 'center' as const,
      accessor: (row: MatrixRow) => (this.isChecked(row.resource, action) ? 'Yes' : 'No'),
    })),
  ];

  protected readonly model = signal<RoleFormModel>({ name: '', description: '' });

  protected readonly matrix = signal<Record<string, Set<PermissionAction>>>(
    Object.fromEntries(
      PERMISSION_RESOURCES.map((resource) => [resource, new Set<PermissionAction>()]),
    ),
  );

  protected readonly roleForm = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.roleId()) return;
      const existing = this.roleService.role(this.roleId());
      if (!existing) return;
      untracked(() => {
        this.model.set({ name: existing.name, description: existing.description });
        this.matrix.set(
          Object.fromEntries(
            PERMISSION_RESOURCES.map((resource) => [
              resource,
              new Set(existing.permissions.find((p) => p.resource === resource)?.actions ?? []),
            ]),
          ),
        );
        this.hydrated.set(true);
      });
    });
  }

  protected resourceLabel(resource: string): string {
    return (
      RESOURCE_LABELS[resource as (typeof PERMISSION_RESOURCES)[number]] ?? statusLabel(resource)
    );
  }

  protected isChecked(resource: string, action: PermissionAction): boolean {
    return this.matrix()[resource]?.has(action) ?? false;
  }

  protected toggle(resource: string, action: PermissionAction, checked: boolean): void {
    this.matrix.update((current) => {
      const next = { ...current, [resource]: new Set(current[resource]) };
      if (checked) next[resource].add(action);
      else next[resource].delete(action);
      return next;
    });
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.roleForm, async () => {
        const value = this.model();
        const permissions = this.resources.map((resource) => ({
          resource,
          actions: Array.from(this.matrix()[resource] ?? []),
        }));
        await this.roleService.save(this.roleId() ?? null, {
          name: value.name,
          description: value.description,
          permissions,
        });
        await this.router.navigate(['/access/roles']);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
