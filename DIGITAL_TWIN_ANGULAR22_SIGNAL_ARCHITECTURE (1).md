# Digital Twin — Angular 22 Signal-First Technical Architecture



---

# 1. Technical Baseline

This section is a **project-level implementation constraint** and supersedes older Angular 16 implementation patterns from the legacy application.

## Current Stable Angular Baseline

As of **2026-09-11**:

```text
Angular        22.1.6 stable
Angular CLI    22.1.6
TypeScript     >=6.0 <6.1
RxJS           ^7.4.0 supported
Node.js        ^22.22.3 || ^24.15.0 || ^26.0.0
Tailwind CSS   v4 — required by spartan/ui's Helm (styled) layer
@angular/cdk   required — spartan/ui Brain layer is built on CDK overlay/a11y primitives
@spartan-ng/brain + @spartan-ng/helm  full spartan/ui stack (behavior + prebuilt styled components)
SCSS           tokens/typography/resets only — component styling comes from Tailwind + Helm
```

`22.2.0-next.*` is pre-release and must not be used for production while the `next` tag remains pre-release.

When actual implementation begins, use the **latest stable Angular 22 patch/minor available on that date**, not an RC/next build. Let spartan.ng's own installer resolve the matching Tailwind/CDK versions rather than hand-picking them.

Recommended project creation:

```bash
npx @angular/cli@22.1.6 new digital-twin \
  --standalone \
  --routing \
  --style=scss \
  --strict
```

Then run `npx @spartan-ng/cli init` to add Tailwind CSS v4 and spartan/ui in one step. SCSS still owns `_tokens.scss`/`_typography.scss`/global resets; Tailwind utility classes (via Helm) own component-level styling.

### Using spartan/ui (Brain + Helm)

- **Brain** (`@spartan-ng/brain`) — accessible behavior: focus trapping, keyboard nav, ARIA state, overlay positioning. You never touch this code directly.
- **Helm** — the styled layer. The CLI *copies* component source into your repo (`shared/ui/button/`, `shared/ui/dialog/`, etc.), so you own it and restyle it with the DT design tokens (dark teal shell, Merik green, Satoshi 400/500, 8/12/14/16px radii) instead of the default shadcn look.

Generate components as you need them rather than up front: `ng g @spartan-ng/cli:ui dialog` (→ `DtModal`), `...popover`, `...select`, `...menu`, `...tabs`, `...tooltip`. Simple primitives with no real behavior (`DtBadge`, `DtStatusChip`, `DtDivider`, `DtSkeleton`) don't need spartan — hand-write those directly as Tailwind components.

## Application Architecture

The rewrite is locked to:

- **standalone-first**
- **signal-first**
- **zoneless**
- **strict TypeScript**
- **lazy-loaded routes**
- **functional providers/interceptors/guards where appropriate**
- **typed API contracts**
- **responsive-by-construction**
- **reusable component architecture**
- **design-token-driven styling**

Do **not** rebuild the legacy NgModule-heavy structure.

### Bootstrap

Target style:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
      ]),
    ),
  ],
});
```

Angular 21+ is zoneless by default. Do not re-add ZoneJS unless a verified dependency makes it unavoidable.

---

# SIGNAL-FIRST STATE MODEL

## `signal()`

Use for local or writable state.

```ts
readonly sidebarOpen = signal(false);
readonly selectedBuildingId = signal<string | null>(null);
readonly selectedRange = signal<TimeRangePreset>('24h');
```

## `computed()`

Use for all derived state.

```ts
readonly selectedBuilding = computed(() =>
  this.buildings().find(
    b => b.id === this.selectedBuildingId()
  ) ?? null
);
```

Do not duplicate a value into another writable signal when it can be derived.

## `linkedSignal()`

Use for writable dependent state.

Typical DT cases:

- selected Floor depends on selected Building
- selected Space depends on selected Floor
- selected metric depends on supported device capabilities
- selected chart series depends on device type

## `httpResource()`

Use for reactive HTTP **reads** when request parameters come from signals.

Good uses:

- Dashboard widget data
- Building summary
- Device detail
- Device list query
- Telemetry query
- Maintenance list
- Notification list
- Role/user list

Example:

```ts
readonly deviceId = input.required<string>();

readonly deviceResource = httpResource<Device>(() =>
  `/api/devices/${this.deviceId()}`
);
```

Do **not** use `httpResource()` for mutations.

## `resource()`

Use when async work is not a simple HttpClient read.

Examples:

- composed multi-source initialization
- 3D scene metadata
- loading a model-manifest abstraction
- async calculation or adapter flow

## Mutations

Use typed services with `HttpClient` for:

```text
POST
PUT
PATCH
DELETE
device commands
file upload
schedule save
maintenance state transitions
user/role writes
```

Mutation state should still be represented with signals:

```text
idle
pending
success
error
```

## `effect()`

Use only for genuine side effects:

- localStorage/session persistence
- analytics logging
- imperative chart library bridge
- 3D renderer bridge
- browser APIs

Do not use `effect()` as a general state propagation mechanism.

## RxJS

RxJS remains required for stream-oriented work:

- Socket.IO/WebSocket
- reconnect/backoff
- debounce/search
- event streams
- complex cancellation/composition
- external libraries exposing Observables

Use Angular interop at boundaries:

```ts
toSignal()
toObservable()
takeUntilDestroyed()
```

Do not force WebSocket streams into a signal-only implementation.

---

# SIGNAL FORMS — DEFAULT FORM ARCHITECTURE

Angular 22 Signal Forms are the default for new forms.

Use for:

- Sign In
- Forgot/Reset Password
- Maintenance request
- User create/edit
- Role create/edit
- Schedule create/edit
- Device configuration
- complex filter forms

Pattern:

```ts
readonly model = signal({
  title: '',
  priority: 'medium',
  buildingId: '',
  floorId: '',
});

readonly maintenanceForm = form(this.model, p => {
  required(p.title);
  required(p.buildingId);
});
```

Reusable field controls should be designed to integrate naturally with Signal Forms.

Reactive Forms are allowed only when a required third-party integration still depends on CVA/Reactive Forms and the compatibility cost is lower than replacing that dependency.

Do not mix form architectures without a specific reason.

---

# REUSABLE COMPONENT ARCHITECTURE — LOCKED

Every UI element should belong to one of four layers.

## Layer 1 — Primitives

No domain knowledge.

```text
DtButton
DtIconButton
DtInput
DtNumberInput
DtSearchInput
DtSelect
DtMultiSelect
DtCheckbox
DtRadio
DtToggle
DtBadge
DtStatusChip
DtTooltip
DtPopover
DtModal
DtDrawer
DtTabs
DtSegmentedControl
DtSkeleton
DtEmptyState
DtErrorState
DtPagination
DtAvatar
DtMenu
DtDivider
```

Rules:

- reusable anywhere
- no API calls
- no route knowledge
- no building/device-specific assumptions
- signal inputs/outputs where appropriate
- styling only through design tokens/variants

## Layer 2 — Composite Components

Reusable application patterns.

```text
PageHeader
FilterBar
SearchFilterBar
DataTable
MetricCard
KpiCard
TrendCard
ChartCard
StatusSummary
DetailsList
Timeline
EntityHeader
LocationBreadcrumb
ContextSelector
NotificationItem
FileUploader
ConfirmActionDialog
```

Rules:

- may understand common application concepts
- never hardcode feature APIs
- accept typed inputs
- emit semantic events

## Layer 3 — Domain Components

Reusable across several screens inside the Digital Twin domain.

```text
DeviceStatus
DeviceIdentity
DeviceQuickView
DevicePropertyList
DeviceTelemetryChart
DeviceControlPanel
DeviceCapabilityTabs
BuildingStatus
FloorSelector
SpaceSelector
TwinInspector
TwinHierarchyTree
TwinDeviceMarker
MaintenanceStatus
MaintenanceTimeline
EnergySummary
EnvironmentSummary
AqiSummary
ConnectivitySummary
```

Rules:

- can understand DT domain types
- still should not own page routing or raw HTTP
- receive state from stores/facades
- usable in Dashboard, Building, Floor, Space and Detail views

## Layer 4 — Feature Pages

```text
DashboardPage
BuildingsPage
BuildingPage
FloorPage
SpacePage
TwinPage
DevicesPage
DevicePage
AnalyticsPage
MaintenancePage
NotificationsPage
UsersPage
RolesPage
```

Rules:

- compose reusable components
- connect to feature stores/facades
- handle route params
- orchestrate page-level actions
- no reusable visual implementation buried inside a page when it can be extracted

---

# COMPONENT API STANDARD

For new components, prefer signal APIs.

```ts
readonly device = input.required<Device>();
readonly compact = input(false);
readonly selected = model(false);
readonly open = output<string>();
```

A reusable component should:

- have typed inputs
- expose the smallest useful public API
- emit semantic actions (`deviceOpened`) rather than DOM-like implementation events
- avoid `any`
- avoid direct `HttpClient`
- avoid direct localStorage
- avoid parent-route assumptions
- avoid global mutable state
- support loading/empty/error/disabled variants where relevant
- be responsive inside its own container
- be keyboard accessible

---

# REUSABLE DATA TABLE

Build one DT table system rather than unique tables per module.

Capabilities:

```text
column definition
sorting
server/client pagination adapter
search
filters
selection
status cell
identity cell
row actions
loading rows
empty state
error state
responsive priority
sticky header
optional column visibility
```

Example:

```ts
interface DtTableColumn<T> {
  id: string;
  label: string;
  value: (row: T) => unknown;
  priority: 1 | 2 | 3;
  sortable?: boolean;
  width?: string;
  align?: 'start' | 'center' | 'end';
}
```

Device, Maintenance, Users, Roles and other list pages should use the same table foundation.

---

# REUSABLE CHART SYSTEM

Do not repeat chart setup inside each feature.

Build:

```text
DtTimeSeriesChart
DtMultiSeriesChart
DtBarChart
DtGauge
DtChartCard
DtChartTooltip
DtChartLegend
```

Each chart receives normalized `TimeSeries`.

Chart wrapper owns:

- ResizeObserver
- responsive axis density
- legend behavior
- loading/error/no-data
- tooltip
- export where supported
- missing-data rendering
- mobile interactions

The feature page only supplies data/config.

Use **one primary chart library** across the new application unless a specific visualization cannot be implemented reasonably with it.

---

# REUSABLE DEVICE RENDERING

Do not create:

```text
TemperatureComponent
HumidityComponent
GasComponent
AQIComponent
MotionComponent
...
```

as separate page architectures.

Use one generic device screen plus capability/domain renderers.

Example:

```text
DevicePage
 ├─ DeviceHeader
 ├─ DeviceStatusSummary
 ├─ DeviceProperties
 ├─ DeviceTelemetry
 ├─ DeviceControls       [if commands]
 ├─ DeviceEvents
 ├─ DeviceSchedule       [if scheduling]
 └─ DeviceConfiguration
```

Specialized visualization can be plugged in through a device renderer registry.

This is how future missing devices are added without redesigning the app.

---

# RESPONSIVE ARCHITECTURE — EVERY SCREEN + EVERY COMPONENT

Responsiveness is a Definition-of-Done requirement, not a later task.

## Target Widths

```text
Small Mobile      360–479px
Mobile            480–767px
Tablet            768–1023px
Small Desktop     1024–1279px
Desktop           1280–1439px
Large Desktop     1440–1919px
Ultra-wide        1920px+
```

Support below 360px gracefully where practical, but 360px is the minimum primary layout target.

## Responsive CSS Rules

Use:

- CSS Grid
- Flexbox
- `minmax()`
- `auto-fit` / `auto-fill` where appropriate
- `clamp()`
- container queries
- logical properties
- design tokens

Do not use Bootstrap grid.

Do not use user-agent/device sniffing.

## Container Queries

Reusable components should adapt to their actual parent width.

Tailwind v4 has `@container` utilities natively — mark a parent `@container` and use `@md:`-prefixed classes on children:

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row gap-3">
    <span class="@md:hidden">compact label</span>
  </div>
</div>
```

Drop to raw CSS only for a one-off breakpoint value Tailwind's defaults don't cover:

```scss
.dt-widget {
  container-type: inline-size;
}

@container (max-width: 520px) {
  .dt-widget__secondary {
    display: none;
  }
}
```

This is critical because the same component may appear:

- in a 3-column Dashboard card
- in a 4-column Building panel
- inside a Drawer
- full-width on mobile

Viewport media queries alone are insufficient.

## Programmatic Breakpoints (TS side)

For layout decisions that can't be expressed in CSS alone — switching a table to a card list, swapping a side panel for a bottom sheet, collapsing the 3D inspector — use a small `matchMedia`-backed signal utility rather than Angular CDK's `BreakpointObserver` or a hand-rolled `window.resize` listener:

```ts
// shared/utils/media-query.signal.ts
export function mediaQuerySignal(query: string) {
  const mql = window.matchMedia(query);
  const state = signal(mql.matches);
  const listener = (e: MediaQueryListEvent) => state.set(e.matches);
  mql.addEventListener('change', listener);
  // pair with DestroyRef to remove the listener if used outside a component field initializer
  return state.asReadonly();
}
```

```ts
readonly isMobile = mediaQuerySignal('(max-width: 767px)');
```

Keep this to real structural changes (different component, not just different spacing) — pure visual responsiveness stays in Tailwind/CSS so it doesn't trigger change detection or re-render churn.

---

# RESPONSIVE APP SHELL

## ≥1440px

```text
Sidebar: 220px
Dashboard: 12-column
Full global search
Hierarchy + 3D + Inspector can coexist
```

## 1280–1439px

```text
Sidebar: 220px
12-column grid
Full tables
Slightly reduced content spans
```

## 1024–1279px

```text
Sidebar: 68px default/collapsible
8–12 column adaptive layout
Search may collapse
Secondary actions -> overflow
3D side panels collapsible
```

## 768–1023px

```text
Navigation: overlay drawer / rail
Main content: full width
Dashboard: 2 KPI cards per row
Filters: drawer
Tables: priority columns + horizontal scroll
3D: one side panel visible at a time
```

## 480–767px

```text
Navigation: drawer
Dashboard: 1 card per row generally
Tiny KPI pairs may be 2-column
Filters: bottom sheet/full screen
Forms: 1 column
Tabs: horizontal scroll
3D inspector: bottom sheet
```

## 360–479px

```text
Single column
16px page gutters
Compact top bar
Actions wrap/collapse
No fixed-width controls
Complex dialogs become full-screen
```

## ≥1920px

Do not stretch form/text content indefinitely.

Allow:

- wider charts
- more dashboard columns where valuable
- larger 3D canvas
- wider data tables

Use component/page-specific max widths rather than a single universal container width.

---

# RESPONSIVE PAGE RULES

## Page Header

Desktop:

```text
Breadcrumb
Title / Description                      Actions
```

Mobile:

```text
Breadcrumb
Title
Description
Primary Action       More
```

Never compress six actions into one mobile row.

## Dashboard

Desktop:
- 4 KPI cards when readable
- 8/4 or 7/5 major composition
- 6/6 secondary composition

Tablet:
- 2 KPIs per row
- major chart full width
- Attention full width or 2-column when container supports it

Mobile:
- important operational content first
- mostly 1-column cards
- 2-column only for compact metrics

Mobile priority order:

1. Attention Required
2. Critical device states
3. Primary KPIs
4. Maintenance
5. Energy
6. Environment/secondary analytics

Do not preserve desktop visual order when it hurts mobile task priority.

## Tables

### Desktop
Full table.

### Tablet
Hide low-priority columns; preserve identity/status/action.

### Mobile
Choose based on task:

**Reduced table** — identity/status/value/action.  
**Row card** — only where row comparison is not primary.  
**Horizontal table** — permission matrices and similar cross-column structures.

Do not turn every table into cards.

## Forms

Desktop:
- 1 or 2 columns
- paired fields only when related

Tablet:
- reduce to one column when required

Mobile:
- one column
- 100% control width
- sticky action bar for long forms where useful

## Tabs

- desktop: inline
- small screens: horizontally scrollable
- active tab always visible
- no wrapped/two-line tab labels

## Filters

Desktop:
- high-value filters inline
- advanced filters in drawer

Tablet/mobile:
- 1–2 key filters inline at most
- remainder in drawer/bottom sheet
- show active filter count

## Dialogs / Drawers

Desktop:
```text
Modal: 400 / 520 / 720px
Drawer: 420 / 520px
```

Tablet:
```text
Modal: up to 80–90vw
Drawer: up to ~70vw
```

Mobile:
- complex modal -> full-screen dialog
- contextual drawer -> bottom sheet or full-screen sheet
- confirmation can remain compact

## Charts

Every chart must:

- measure its actual container
- resize without page reload
- reduce x-axis tick density
- adapt legend placement
- support touch
- avoid unreadable labels
- maintain minimum plot height
- show data table/summary fallback where required for accessibility

## 3D Viewer

Desktop:
- hierarchy + scene + inspector

Tablet:
- scene + one collapsible side panel

Mobile:
- scene full width
- hierarchy as sheet
- inspector as bottom sheet
- simplified controls
- no tiny floating desktop panel layout

## Navigation

Do not make sidebar behavior depend on `/dashboard` versus other routes as in the legacy implementation. Responsive navigation behavior is based on available width.

---

# RESPONSIVE COMPONENT CONTRACT

Every reusable component must document:

```text
minimum usable width
preferred width
wrapping behavior
overflow behavior
touch behavior
keyboard behavior
mobile transformation
empty/error/loading behavior
```

No reusable component is approved if it only works in the Figma width where it was originally designed.

---

# RESPONSIVE TEST MATRIX

Every major page must be verified at:

```text
360 × 800
390 × 844
480 × 900
768 × 1024
1024 × 768
1280 × 800
1440 × 900
1920 × 1080
```

Also test:

- zoom 200%
- long labels
- long device names
- large numeric values
- empty states
- error states
- loading states
- 0 rows / 1 row / many rows
- many tabs
- large filter selections
- open drawer/modal
- 3D unavailable

Use Playwright visual screenshots for the critical viewport matrix.

---

# RESPONSIVE DEFINITION OF DONE

A screen/component is not done until:

- no unintended horizontal page scroll at target widths
- no clipped action
- no inaccessible menu
- no overlapping card
- no unreadable chart
- no overflowed KPI
- tables have an intentional small-screen strategy
- form fields remain usable
- modal/drawer controls remain reachable
- touch and keyboard paths work
- 200% browser zoom remains operable
- long content has been tested

---

# PROJECT FOLDER ARCHITECTURE

Recommended structure:

```text
src/app/
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── auth/
│   ├── http/
│   ├── permissions/
│   ├── sockets/
│   ├── config/
│   └── observability/
├── shared/
│   ├── ui/                    ← spartan Helm output lives here, restyled with DT tokens
│   │   ├── button/            (ng g @spartan-ng/cli:ui button)
│   │   ├── input/              (ng g @spartan-ng/cli:ui input)
│   │   ├── select/              (ng g @spartan-ng/cli:ui select)
│   │   ├── dialog/               (ng g @spartan-ng/cli:ui dialog  -> DtModal)
│   │   ├── popover/               (ng g @spartan-ng/cli:ui popover)
│   │   ├── table/                  hand-written (DataTable composite, not a spartan primitive)
│   │   ├── chart/                   hand-written (thin wrapper over chart lib)
│   │   └── ...
│   ├── layout/
│   ├── pipes/
│   ├── directives/
│   ├── utils/
│   └── types/
├── domain/
│   ├── buildings/
│   ├── locations/
│   ├── devices/
│   ├── telemetry/
│   ├── maintenance/
│   ├── notifications/
│   └── access/
├── features/
│   ├── dashboard/
│   ├── buildings/
│   ├── devices/
│   ├── analytics/
│   ├── maintenance/
│   ├── schedules/
│   ├── notifications/
│   └── access/
└── styles/
    ├── _tokens.scss           ← CSS custom properties, consumed by @theme in tailwind
    ├── _typography.scss
    ├── _responsive.scss
    └── styles.scss

components.json                 ← spartan/ui CLI config (paths/aliases for `ng g @spartan-ng/cli:ui`)
tailwind.config.ts / @theme      ← Tailwind v4 theme, mapped to _tokens.scss custom properties
```

Map the DT design tokens into Tailwind's `@theme` block so both Tailwind utilities and hand-written SCSS read from one source of truth:

```css
@theme {
  --color-shell: #1B4143;
  --color-merik: #24B262;
  --color-merik-light: #4ADA89;
  --color-canvas: #F4F7F6;
  --radius-control: 8px;
  --radius-card: 12px;
}
```

## Dependency Direction

```text
features
  ↓
domain
  ↓
core

features
  ↓
shared

domain must not import features
shared must not import features
```

This prevents the cross-module coupling present in the legacy app.

---

# CODING STANDARDS

## Required

- strict typing
- `readonly` by default
- `inject()` consistently
- signals for component state
- computed derived values
- `takeUntilDestroyed()` for subscriptions
- native Angular control flow: `@if`, `@for`, `@switch`
- track expressions in `@for`
- typed route data
- functional interceptors
- no direct environment URL concatenation in features
- no `window.location.reload()` for state refresh
- no manual component construction with `new`
- no duplicated date/status/device inference utilities
- no component with hundreds of unrelated properties/methods

## Component Size Guideline

A page becoming very large is an architecture warning.

Split by responsibility:

```text
Page orchestration
Domain section
Reusable visual component
Store/facade
Adapter/service
```

Do not recreate 700–1000-line page components from the legacy project.

---

# PERFORMANCE RULES FOR SIGNAL APP

- use `computed()` instead of template method calls for derived collections
- use `@for (...; track entity.id)`
- do not clone large arrays unnecessarily
- virtualize genuinely large lists
- server paginate large device tables where possible
- lazy load feature routes
- lazy load 3D and heavy charts
- defer noncritical dashboard widgets when appropriate
- use container ResizeObserver only inside wrapper components that need it
- cache historical telemetry
- cancel obsolete data requests
- scope socket subscriptions to visible/needed entities

---

# REVISED IMPLEMENTATION GATE

Before feature development begins, confirm:

1. Angular 22 stable project scaffold is created.
2. Zoneless operation is verified.
3. Signal state conventions are documented.
4. Signal Forms wrappers are proven.
5. Responsive shell works from 360px to 1920px+.
6. Core reusable component library is implemented.
7. Data table works across all breakpoint classes.
8. Chart wrapper resizes by container.
9. Modal/drawer transforms correctly on mobile.
10. Twin viewer has responsive panel strategy.
11. API adapter layer is typed.
12. Socket gateway pattern is proven.
13. Device renderer registry supports unknown/new device types.

Only then should feature screens be built at scale.

