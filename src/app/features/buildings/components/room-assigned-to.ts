import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AccessAssignment } from '../../../domain/access/access-assignment.types';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { RoomStatCard } from './room-stat-card';

@Component({
  selector: 'app-room-assigned-to',
  imports: [RouterLink, RoomStatCard, ...HlmAvatarImports, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-assigned-to.html',
})
export class RoomAssignedTo {
  readonly assignments = input.required<AccessAssignment[]>();
  readonly compact = input(false);

  protected readonly primary = computed(() => this.assignments()[0] ?? null);
  protected readonly extraCount = computed(() => Math.max(0, this.assignments().length - 1));

  protected initials(name: string): string {
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?'
    );
  }
}
