import { DestroyRef, signal } from '@angular/core';

export function mediaQuerySignal(query: string, destroyRef?: DestroyRef) {
  const mql = window.matchMedia(query);
  const state = signal(mql.matches);
  const listener = (e: MediaQueryListEvent) => state.set(e.matches);

  mql.addEventListener('change', listener);
  destroyRef?.onDestroy(() => mql.removeEventListener('change', listener));

  return state.asReadonly();
}
