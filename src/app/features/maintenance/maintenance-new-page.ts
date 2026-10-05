import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideImage, lucideX } from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import {
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceCategory,
  type MaintenancePriority,
} from '../../domain/maintenance/maintenance.types';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { statusLabel } from '../../shared/utils/status-tone';

interface NewMaintenanceModel {
  name: string;
  contactNo: string;
  email: string;
  title: string;
  description: string;
  buildingId: string;
  floorId: string;
  spaceId: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  imageDataUrl: string | null;
}

const CONTACT_COUNTRY_CODE = '+974';
const MAX_IMAGE_BYTES = 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const PRIORITY_OPTIONS: SelectOption[] = ['low', 'medium', 'high', 'urgent'].map((p) => ({
  value: p,
  label: statusLabel(p),
}));
const CATEGORY_OPTIONS: SelectOption[] = (
  Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[]
).map((c) => ({ value: c, label: MAINTENANCE_CATEGORY_LABELS[c] }));

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Only JPG, JPEG, or PNG images are allowed.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be less than 1MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

@Component({
  selector: 'app-maintenance-new-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideChevronLeft, lucideImage, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-new-page.html',
})
export class MaintenanceNewPage {
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly contactCountryCode = CONTACT_COUNTRY_CODE;

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly priorityLabel = selectOptionLabelFn(() => this.priorityOptions);
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly categoryLabel = selectOptionLabelFn(() => this.categoryOptions);

  protected readonly model = signal<NewMaintenanceModel>({
    name: '',
    contactNo: '',
    email: '',
    title: '',
    description: '',
    buildingId: this.route.snapshot.queryParamMap.get('buildingId') ?? '',
    floorId: this.route.snapshot.queryParamMap.get('floorId') ?? '',
    spaceId: this.route.snapshot.queryParamMap.get('spaceId') ?? '',
    priority: 'medium',
    category: 'general',
    imageDataUrl: null,
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

  protected readonly requestForm = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });
    required(p.contactNo, { message: 'Contact number is required' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.title, { message: 'Title is required' });
    required(p.description, { message: 'Description is required' });
    required(p.buildingId, { message: 'Select a building' });
    required(p.floorId, { message: 'Select a floor' });
    required(p.spaceId, { message: 'Select a space' });
    required(p.imageDataUrl, { message: 'Upload a photo of the issue' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  protected readonly imageError = signal<string | null>(null);
  protected readonly imageDragOver = signal(false);

  protected async onImageFileSelected(file: File | undefined): Promise<void> {
    if (!file) return;
    this.imageError.set(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      this.model.update((m) => ({ ...m, imageDataUrl: dataUrl }));
    } catch (error) {
      this.imageError.set(error instanceof Error ? error.message : 'Could not read image file.');
    }
  }

  protected removeImage(): void {
    this.model.update((m) => ({ ...m, imageDataUrl: null }));
    this.imageError.set(null);
  }

  protected onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.imageDragOver.set(false);
    void this.onImageFileSelected(event.dataTransfer?.files?.[0]);
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.requestForm, async () => {
        const value = this.model();
        const created = await this.maintenanceService.create({
          title: value.title,
          description: value.description,
          buildingId: value.buildingId,
          floorId: value.floorId || undefined,
          spaceId: value.spaceId || undefined,
          priority: value.priority,
          category: value.category,
          requester: value.name,
          requesterContact: `${CONTACT_COUNTRY_CODE} ${value.contactNo}`.trim(),
          requesterEmail: value.email,
          imageDataUrl: value.imageDataUrl ?? undefined,
        });
        await this.router.navigate(['/operations/maintenance', created.id]);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
