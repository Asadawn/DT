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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { BuildingService } from '../../domain/buildings/building.service';
import { BookingService } from '../../domain/bookings/booking.service';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { dateToIso, isoToDate } from '../../shared/utils/date-only';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';

interface NewBookingModel {
  guestName: string;
  numberOfGuests: string;
  buildingId: string;
  floorId: string;
  spaceId: string;
  checkInDate: string;
  checkOutDate: string;
  notes: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-booking-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-form-page.html',
})
export class BookingFormPage {
  readonly bookingId = input<string>();

  private readonly bookingService = inject(BookingService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isEditMode = computed(() => !!this.bookingId());
  protected readonly existing = computed(() => this.bookingService.booking(this.bookingId()));

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly model = signal<NewBookingModel>({
    guestName: '',
    numberOfGuests: '',
    buildingId: this.route.snapshot.queryParamMap.get('buildingId') ?? '',
    floorId: this.route.snapshot.queryParamMap.get('floorId') ?? '',
    spaceId: this.route.snapshot.queryParamMap.get('spaceId') ?? '',
    checkInDate: todayIso(),
    checkOutDate: todayIso(),
    notes: '',
  });

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.bookingId()) return;
      const existing = this.existing();
      if (!existing) return;
      untracked(() => {
        this.model.set({
          guestName: existing.guestName,
          numberOfGuests:
            existing.numberOfGuests !== undefined ? String(existing.numberOfGuests) : '',
          buildingId: existing.buildingId,
          floorId: existing.floorId ?? '',
          spaceId: existing.spaceId,
          checkInDate: existing.checkInDate,
          checkOutDate: existing.checkOutDate,
          notes: existing.notes ?? '',
        });
        this.hydrated.set(true);
      });
    });
  }

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

  protected readonly isoToDate = isoToDate;

  protected setCheckInDate(date: Date | null): void {
    this.model.update((m) => ({ ...m, checkInDate: dateToIso(date) }));
  }

  protected setCheckOutDate(date: Date | null): void {
    this.model.update((m) => ({ ...m, checkOutDate: dateToIso(date) }));
  }

  protected readonly bookingForm = form(this.model, (p) => {
    required(p.guestName, { message: 'Guest name is required' });
    required(p.buildingId, { message: 'Select a building' });
    required(p.spaceId, { message: 'Select a space' });
    required(p.checkInDate, { message: 'Check-in date is required' });
    required(p.checkOutDate, { message: 'Check-out date is required' });
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly submitAttempted = signal(false);

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await submit(this.bookingForm, async () => {
        const value = this.model();
        const patch = {
          guestName: value.guestName,
          numberOfGuests: value.numberOfGuests ? Number(value.numberOfGuests) : undefined,
          buildingId: value.buildingId,
          floorId: value.floorId || undefined,
          spaceId: value.spaceId,
          checkInDate: value.checkInDate,
          checkOutDate: value.checkOutDate,
          notes: value.notes || undefined,
        };
        try {
          const id = this.bookingId();
          if (id) {
            await this.bookingService.update(id, patch);
            toast.success(`Booking for ${patch.guestName} updated`);
            await this.router.navigate(['/operations/occupancy/bookings', id]);
          } else {
            const created = await this.bookingService.create(patch);
            toast.success(`Booking created for ${patch.guestName}`);
            await this.router.navigate(['/operations/occupancy/bookings', created.id]);
          }
        } catch (error) {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Could not save this booking.',
          );
        }
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
