import { Injectable, computed, effect, signal } from '@angular/core';
import type { MutationState } from '../../shared/types/canonical.types';
import { simulateLatency } from '../../shared/utils/simulate-latency';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  avatarUrl?: string;
}

const SESSION_STORAGE_KEY = 'dt.fixture-session';

function readStoredUser(): AuthenticatedUser | null {
  try {
    const raw =
      sessionStorage.getItem(SESSION_STORAGE_KEY) ?? localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<AuthenticatedUser | null>(readStoredUser());
  private readonly signInStateSignal = signal<MutationState>('idle');
  private readonly rememberMeSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly signInState = this.signInStateSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    effect(() => {
      const user = this.currentUserSignal();
      try {
        if (user) {
          const target = this.rememberMeSignal() ? localStorage : sessionStorage;
          const other = this.rememberMeSignal() ? sessionStorage : localStorage;
          target.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
          other.removeItem(SESSION_STORAGE_KEY);
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch {}
    });
  }

  async signIn(
    email: string,
    password: string,
    roleId = 'r1',
    rememberMe = false,
  ): Promise<AuthenticatedUser> {
    this.signInStateSignal.set('pending');
    await simulateLatency(400);

    if (!email.trim() || !password.trim()) {
      this.signInStateSignal.set('error');
      throw new Error('Email and password are required.');
    }

    const user: AuthenticatedUser = {
      id: 'u1',
      email,
      displayName: email.split('@')[0].replace(/[._]/g, ' '),
      roleId,
    };
    this.rememberMeSignal.set(rememberMe);
    this.currentUserSignal.set(user);
    this.signInStateSignal.set('success');
    return user;
  }

  signOut(): void {
    this.currentUserSignal.set(null);
    this.signInStateSignal.set('idle');
  }

  async updateProfile(patch: {
    displayName?: string;
    avatarUrl?: string;
  }): Promise<AuthenticatedUser> {
    await simulateLatency(300);
    const current = this.currentUserSignal();
    if (!current) throw new Error('Not signed in.');
    const updated: AuthenticatedUser = { ...current, ...patch };
    this.currentUserSignal.set(updated);
    return updated;
  }

  async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
    await simulateLatency(400);
  }
}
