import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceCategory,
} from '../../domain/maintenance/maintenance.types';
import { VendorService } from '../../domain/vendors/vendor.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';

interface VendorModel {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialties: MaintenanceCategory[];
}

const SPECIALTIES = Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[];

@Component({
  selector: 'app-vendor-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmCheckboxImports,
    ...HlmInputImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendor-form-page.html',
})
export class VendorFormPage {
  readonly vendorId = input<string>();

  private readonly vendorService = inject(VendorService);
  private readonly router = inject(Router);

  protected readonly specialtyOptions = SPECIALTIES;
  protected readonly categoryLabels = MAINTENANCE_CATEGORY_LABELS;

  protected readonly existing = computed(() => this.vendorService.vendor(this.vendorId()));

  protected readonly model = signal<VendorModel>({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    specialties: [],
  });

  protected readonly vendorForm = form(this.model, (p) => {
    required(p.name, { message: 'Vendor name is required' });
    required(p.contactName, { message: 'Contact name is required' });
    required(p.contactEmail, { message: 'Contact email is required' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.vendorId()) return;
      const existing = this.existing();
      if (!existing) return;
      untracked(() => {
        this.model.set({
          name: existing.name,
          contactName: existing.contactName,
          contactEmail: existing.contactEmail,
          contactPhone: existing.contactPhone,
          specialties: [...existing.specialties],
        });
        this.hydrated.set(true);
      });
    });
  }

  protected toggleSpecialty(specialty: MaintenanceCategory, checked: boolean): void {
    this.model.update((m) => ({
      ...m,
      specialties: checked
        ? [...m.specialties, specialty]
        : m.specialties.filter((s) => s !== specialty),
    }));
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.vendorForm, async () => {
        const value = this.model();
        const id = this.vendorId();
        const saved = id
          ? await this.vendorService.update(id, value)
          : await this.vendorService.create(value);
        await this.router.navigate(['/operations/vendors', saved.id]);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
