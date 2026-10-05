import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessAssignmentService } from '../../../domain/access/access-assignment.service';
import type { AccessAssignment } from '../../../domain/access/access-assignment.types';
import { RoomStatCard } from './room-stat-card';

@Component({
  selector: 'app-room-access-control',
  imports: [RouterLink, RoomStatCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './room-access-control.html',
})
export class RoomAccessControl {
  readonly assignments = input.required<AccessAssignment[]>();

  private readonly accessAssignmentService = inject(AccessAssignmentService);

  protected readonly hasActiveAccess = computed(() =>
    this.assignments().some((a) => this.accessAssignmentService.status(a) === 'active'),
  );
}
