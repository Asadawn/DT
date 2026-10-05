import '@google/model-viewer';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

interface ModelViewerElement extends HTMLElement {
  materialFromPoint(pixelX: number, pixelY: number): { name: string } | null;
  positionAndNormalFromPoint(
    pixelX: number,
    pixelY: number,
  ): {
    position: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
  } | null;
  cameraOrbit: string;
}

export interface ModelClickInfo {
  materialName: string | null;
  cameraOrbit: string;
  normalY: number | null;
  position: { x: number; y: number; z: number } | null;
}

@Component({
  selector: 'dt-model-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <model-viewer
      #viewer
      [attr.src]="src()"
      [attr.alt]="alt()"
      camera-controls
      disable-tap
      environment-image="neutral"
      shadow-intensity="1"
      exposure="0.8"
      interaction-prompt="when-focused"
      [attr.min-camera-orbit]="minCameraOrbit()"
      [attr.max-camera-orbit]="maxCameraOrbit()"
      [attr.field-of-view]="fieldOfView()"
      interaction-policy="always-allow"
      touch-action="pan-y"
      [attr.camera-target]="cameraTarget()"
      [attr.camera-orbit]="cameraOrbit()"
      class="block h-full w-full rounded-card"
      (load)="loaded.emit()"
      (click)="onClick($event)"
      (pointermove)="onPointerMove($event)"
      (pointerleave)="setHoverCursor(false)"
      ><ng-content
    /></model-viewer>
  `,
})
export class DtModelViewer {
  readonly src = input.required<string>();
  readonly alt = input('3D model');
  readonly cameraOrbit = input('45deg 67deg 10m');
  readonly cameraTarget = input('0m 2m 0m');
  readonly fieldOfView = input('30deg');
  readonly minCameraOrbit = input('auto');
  readonly maxCameraOrbit = input('auto');
  readonly hoverMaterialPattern = input<RegExp | undefined>(undefined);
  readonly hoverMinNormalY = input<number>(0.7);
  readonly hoverMinWorldY = input<number>(-Infinity);
  readonly hoverRegionTest = input<
    ((position: { x: number; y: number; z: number }) => boolean) | undefined
  >(undefined);
  readonly loaded = output<void>();
  readonly modelClicked = output<ModelClickInfo>();

  private readonly viewer = viewChild.required<ElementRef<ModelViewerElement>>('viewer');
  private hoveringMatch = false;

  protected onClick(event: MouseEvent): void {
    const el = this.viewer().nativeElement;
    const material = el.materialFromPoint(event.clientX, event.clientY);
    const hit = el.positionAndNormalFromPoint(event.clientX, event.clientY);
    this.modelClicked.emit({
      materialName: material?.name ?? null,
      cameraOrbit: el.cameraOrbit,
      normalY: hit?.normal.y ?? null,
      position: hit?.position ?? null,
    });
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.buttons !== 0) return;
    const pattern = this.hoverMaterialPattern();
    const regionTest = this.hoverRegionTest();
    if (!pattern && !regionTest) return;

    const el = this.viewer().nativeElement;
    let matches = false;

    if (pattern) {
      const material = el.materialFromPoint(event.clientX, event.clientY);
      if (material && pattern.test(material.name)) {
        const hit = el.positionAndNormalFromPoint(event.clientX, event.clientY);
        matches =
          !!hit &&
          hit.normal.y >= this.hoverMinNormalY() &&
          hit.position.y >= this.hoverMinWorldY();
      }
    }

    if (!matches && regionTest) {
      const hit = el.positionAndNormalFromPoint(event.clientX, event.clientY);
      matches = !!hit && regionTest(hit.position);
    }

    this.setHoverCursor(matches);
  }

  protected setHoverCursor(matches: boolean): void {
    if (matches === this.hoveringMatch) return;
    this.hoveringMatch = matches;
    const userInput =
      this.viewer().nativeElement.shadowRoot?.querySelector<HTMLElement>('.userInput');
    if (userInput) userInput.style.cursor = matches ? 'pointer' : 'grab';
  }
}
