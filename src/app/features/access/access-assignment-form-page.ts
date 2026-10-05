import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { AccessAssignmentService } from '../../domain/access/access-assignment.service';
import type { AccessPrincipalType } from '../../domain/access/access-assignment.types';
import { BuildingService } from '../../domain/buildings/building.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import type { SelectOption } from '../../shared/types/canonical.types';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';

interface AssignmentModel {
  principalName: string;
  principalType: AccessPrincipalType;
  roleLabel: string;
  buildingId: string;
  floorId: string;
  spaceId: string;
  validFrom: string;
  validUntil: string;
}

const PRINCIPAL_TYPE_OPTIONS: SelectOption[] = [
  { value: 'staff', label: 'Internal staff' },
  { value: 'vendor-technician', label: 'Vendor technician' },
  { value: 'guest', label: 'Guest' },
];

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-access-assignment-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-assignment-form-page.html',
})
export class AccessAssignmentFormPage {
  private readonly assignmentService = inject(AccessAssignmentService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly principalTypeOptions = PRINCIPAL_TYPE_OPTIONS;
  protected readonly principalTypeLabel = selectOptionLabelFn(() => this.principalTypeOptions);

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  private readonly queryParams = this.route.snapshot.queryParamMap;
  private readonly maintenanceId = this.queryParams.get('maintenanceId') ?? undefined;
  private readonly vendorId = this.queryParams.get('vendorId') ?? undefined;

  protected readonly model = signal<AssignmentModel>({
    principalName: this.queryParams.get('principalName') ?? '',
    principalType: this.vendorId ? 'vendor-technician' : 'staff',
    roleLabel: this.queryParams.get('roleLabel') ?? '',
    buildingId: this.queryParams.get('buildingId') ?? '',
    floorId: this.queryParams.get('floorId') ?? '',
    spaceId: this.queryParams.get('spaceId') ?? '',
    validFrom: toDatetimeLocal(new Date().toISOString()),
    validUntil: toDatetimeLocal(new Date(Date.now() + 8 * 60 * 60_000).toISOString()),
  });

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.model().buildingId
      ? this.buildingService
          .floorsForBuilding(this.model().buildingId)
          .map((f) => ({ value: f.id, label: f.name }))
      : [],
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);

  protected readonly spaceOptions = computed<SelectOption[]>(() =>
    this.model().floorId
      ? this.buildingService
          .spacesForFloor(this.model().floorId)
          .map((s) => ({ value: s.id, label: s.name }))
      : [],
  );
  protected readonly spaceLabel = selectOptionLabelFn(this.spaceOptions);

  protected readonly assignmentForm = form(this.model, (p) => {
    required(p.principalName, { message: 'Principal name is required' });
    required(p.roleLabel, { message: 'Purpose is required' });
    required(p.buildingId, { message: 'Select a building' });
    required(p.validFrom, { message: 'Start is required' });
    required(p.validUntil, { message: 'End is required' });
  });

  protected readonly validityError = computed(() => {
    const value = this.model();
    if (!value.validFrom || !value.validUntil) return null;
    return new Date(value.validUntil) <= new Date(value.validFrom)
      ? 'End must be after start.'
      : null;
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    if (this.validityError()) return;
    this.submitting.set(true);
    try {
      await submit(this.assignmentForm, async () => {
        const value = this.model();
        const created = await this.assignmentService.create({
          principalName: value.principalName,
          principalType: value.principalType,
          roleLabel: value.roleLabel,
          buildingId: value.buildingId,
          floorId: value.floorId || undefined,
          spaceId: value.spaceId || undefined,
          validFrom: new Date(value.validFrom).toISOString(),
          validUntil: new Date(value.validUntil).toISOString(),
          maintenanceId: this.maintenanceId,
          vendorId: this.vendorId,
        });
        await this.router.navigate(['/operations/access-assignments', created.id]);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
