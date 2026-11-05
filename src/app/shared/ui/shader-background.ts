import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  input,
  viewChild,
} from '@angular/core';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

const VERTEX = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
// The reference's ordered Bayer dithering, expressed without dynamic array
// indexing so it also compiles on WebGL 1 mobile drivers.
const FRAGMENT = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_base;
uniform vec3 u_accent;
float bayer2(vec2 p) { return p.y < 1.0 ? p.x * 2.0 : 3.0 - p.x * 2.0; }
float bayerDither(vec2 p) {
  vec2 cell = mod(floor(p / 4.0), 4.0);
  return (4.0 * bayer2(mod(cell, 2.0)) + bayer2(floor(cell / 2.0))) / 16.0;
}
void main() {
  vec2 pc = gl_FragCoord.xy;
  float time = u_time / 3.0;
  vec2 a = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 c = pc / u_resolution * a * 3.5 + time * 0.3;
  float k = 0.1 + cos(c.y + sin(0.148 - time)) + 2.4 * time;
  float w = 0.9 + sin(c.x + cos(0.628 + time)) - 0.7 * time;
  float s = 7.0 * cos(length(c) + w) * sin(k + w);
  vec3 color = 0.5 + 0.5 * cos(s + vec3(0.2, 0.5, 0.9));
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  float bw = step(bayerDither(pc), gray);
  gl_FragColor = vec4(mix(u_base, u_accent, bw), 1.0);
}`;

@Component({
  selector: 'ui-shader-background',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
      overflow: hidden;
      opacity: var(--recommendation-opacity);
      background: radial-gradient(
        ellipse at top,
        var(--recommendation-accent),
        transparent 70%
      );
      mask-image: linear-gradient(to bottom, #000, #000 45%, transparent 100%);
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class ShaderBackground {
  readonly paused = input(false);
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroy = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private readonly mode = inject(ColorModeStore);
  private updatePalette?: () => void;
  private updateMotion?: () => void;

  constructor() {
    afterRenderEffect(() => {
      this.mode.effective();
      this.zone.runOutsideAngular(() => this.updatePalette?.());
    });
    afterRenderEffect(() => {
      this.paused();
      this.zone.runOutsideAngular(() => this.updateMotion?.());
    });
    afterNextRender(() => this.zone.runOutsideAngular(() => this.initialize()));
  }

  private initialize() {
    const canvas = this.canvas().nativeElement;
    // Keep the CSS fallback visible until GPU compilation/linking succeeds.
    canvas.style.opacity = '0';
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const time = gl.getUniformLocation(program, 'u_time');
    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const base = gl.getUniformLocation(program, 'u_base');
    const accent = gl.getUniformLocation(program, 'u_accent');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastDraw = 0;
    let lost = false;
    let previousTime = performance.now();
    let elapsed = 0;
    const draw = (now: number) => {
      if (lost || document.hidden) return;
      if (!this.paused() && !reducedMotion.matches) {
        elapsed += Math.max(0, now - previousTime) / 2000;
      }
      previousTime = now;
      gl.uniform1f(time, reducedMotion.matches ? 0 : elapsed);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    this.updatePalette = () => {
      if (lost) return;
      // Read the already applied pre-paint/runtime palette, never the store's SSR default.
      const styles = getComputedStyle(canvas);
      gl.uniform3fv(
        base,
        shaderColor(styles.getPropertyValue('--recommendation-base')),
      );
      gl.uniform3fv(
        accent,
        shaderColor(styles.getPropertyValue('--recommendation-accent')),
      );
      if (!document.hidden) draw(performance.now());
    };
    this.updatePalette();
    canvas.style.opacity = '1';
    const tick = (now: number) => {
      if (now - lastDraw >= 1000 / 30) {
        draw(now);
        lastDraw = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (lost || document.hidden) return;
      previousTime = performance.now();
      draw(previousTime);
      if (!reducedMotion.matches && !this.paused())
        frame = requestAnimationFrame(tick);
    };
    this.updateMotion = resume;
    const resize = new ResizeObserver(() => {
      // One physical pixel per CSS pixel caps GPU work, even on high-DPI phones.
      canvas.width = Math.max(1, Math.round(canvas.clientWidth));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw(performance.now());
    });
    const onLost = () => {
      lost = true;
      cancelAnimationFrame(frame);
      canvas.style.opacity = '0';
    };
    resize.observe(canvas);
    reducedMotion.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    canvas.addEventListener('webglcontextlost', onLost);
    resume();
    this.destroy.onDestroy(() => {
      cancelAnimationFrame(frame);
      this.updatePalette = undefined;
      this.updateMotion = undefined;
      resize.disconnect();
      reducedMotion.removeEventListener('change', resume);
      document.removeEventListener('visibilitychange', resume);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    });
  }
}

/** Palette tokens are hexadecimal sRGB values; WebGL expects normalized channels. */
export function shaderColor(color: string): Float32Array {
  const value = color.trim().replace('#', '');
  const hex =
    value.length === 3
      ? [...value].map((channel) => channel + channel).join('')
      : value;
  return new Float32Array(
    [0, 2, 4].map(
      (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
    ),
  );
}
