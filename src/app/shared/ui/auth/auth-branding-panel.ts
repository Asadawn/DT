import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dt-auth-branding-panel',
  host: { class: 'contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="bg-shell relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:w-[38%]"
    >
      <div
        class="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
        aria-hidden="true"
      ></div>

      <div class="relative flex items-center gap-2.5">
        <span
          class="bg-merik-light/15 text-merik-light flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-lg"
          >◈</span
        >
        <span class="text-base font-medium">Digital Twin</span>
      </div>

      <div class="relative flex flex-col gap-6">
        <h1 class="text-3xl leading-tight font-medium text-balance">{{ heading() }}</h1>
        <p class="max-w-sm text-sm text-white/70">{{ description() }}</p>
        <ul class="flex flex-col gap-3 text-sm text-white/85">
          @for (item of features(); track item) {
            <li class="flex items-center gap-2.5">
              <span
                class="bg-merik-light/20 text-merik-light flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                >✓</span
              >
              {{ item }}
            </li>
          }
        </ul>
      </div>

      <p class="relative text-xs text-white/45">
        Fixture demo environment — no real data or backend.
      </p>
    </aside>
  `,
})
export class DtAuthBrandingPanel {
  readonly heading = input('Operate every building from one place.');
  readonly description = input(
    'Devices, maintenance, vendors, automations and analytics — one workspace across your whole portfolio.',
  );
  readonly features = input<string[]>([
    'Real-time device state and control',
    'Maintenance, vendor and access workflows',
    'Automations and portfolio analytics',
  ]);
}

@Component({
  selector: 'dt-auth-mobile-logo',
  host: { class: 'contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex items-center gap-2.5 lg:hidden">
      <span
        class="bg-shell text-merik-light flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-lg"
        >◈</span
      >
      <span class="text-base font-medium">Digital Twin</span>
    </div>
  `,
})
export class DtAuthMobileLogo {}
