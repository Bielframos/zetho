import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ShaderBackground, shaderColor } from './shader-background';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

describe('ShaderBackground palette lifecycle', () => {
  let gl: any;
  let mode: { effective: ReturnType<typeof signal<'light' | 'dark'>> };
  let media: MediaQueryList;
  let events: EventTarget;
  beforeEach(() => {
    gl = {};
    for (const name of [
      'createShader',
      'shaderSource',
      'compileShader',
      'deleteShader',
      'createProgram',
      'attachShader',
      'linkProgram',
      'deleteProgram',
      'useProgram',
      'createBuffer',
      'bindBuffer',
      'bufferData',
      'getAttribLocation',
      'enableVertexAttribArray',
      'vertexAttribPointer',
      'uniform1f',
      'uniform2f',
      'uniform3fv',
      'drawArrays',
      'viewport',
      'deleteBuffer',
      'getExtension',
    ])
      gl[name] = jasmine.createSpy(name).and.returnValue({});
    gl.getShaderParameter = gl.getProgramParameter = () => true;
    gl.getUniformLocation = (_: any, name: string) => name;
    gl.getExtension.and.returnValue(null);
    spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(gl);
    spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    spyOn(window, 'cancelAnimationFrame');
    events = new EventTarget();
    media = {
      matches: false,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    } as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(media);
    mode = { effective: signal<'light' | 'dark'>('dark') };
    TestBed.configureTestingModule({
      imports: [ShaderBackground],
      providers: [{ provide: ColorModeStore, useValue: mode }],
    });
  });
  const create = () => {
    const fixture = TestBed.createComponent(ShaderBackground);
    fixture.nativeElement.style.setProperty('--recommendation-base', '#fcfcfd');
    fixture.nativeElement.style.setProperty(
      '--recommendation-accent',
      '#315bc8',
    );
    fixture.detectChanges();
    return fixture;
  };
  it('reads prepaint colors and updates twenty times without recreating the program or RAF loop', () => {
    const fixture = create();
    expect(gl.uniform3fv).toHaveBeenCalledWith(
      'u_base',
      shaderColor('#fcfcfd'),
    );
    const loops = () =>
      (window.requestAnimationFrame as jasmine.Spy).calls
        .allArgs()
        .filter(([callback]) => callback.name === 'tick').length;
    const scheduled = loops();
    for (let i = 0; i < 20; i++) {
      fixture.nativeElement.style.setProperty(
        '--recommendation-base',
        i % 2 ? '#101113' : '#fcfcfd',
      );
      mode.effective.set(i % 2 ? 'dark' : 'light');
      fixture.detectChanges();
    }
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(loops()).toBe(scheduled);
    expect(gl.uniform3fv).toHaveBeenCalledWith(
      'u_base',
      shaderColor('#101113'),
    );
    fixture.destroy();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  });
  it('redraws a stopped reduced-motion canvas on theme change and uses fallback after context loss', () => {
    Object.defineProperty(media, 'matches', { value: true });
    const fixture = create();
    gl.drawArrays.calls.reset();
    mode.effective.set('light');
    fixture.detectChanges();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(
      (window.requestAnimationFrame as jasmine.Spy).calls
        .allArgs()
        .some(([callback]) => callback.name === 'tick'),
    ).toBeFalse();
    const canvas: HTMLCanvasElement =
      fixture.nativeElement.querySelector('canvas');
    canvas.dispatchEvent(new Event('webglcontextlost'));
    gl.drawArrays.calls.reset();
    mode.effective.set('dark');
    fixture.detectChanges();
    expect(canvas.style.opacity).toBe('0');
    expect(gl.drawArrays).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it('pauses hidden rendering and resumes one loop, then removes its listeners on destroy', () => {
    let hidden = false;
    spyOnProperty(document, 'hidden', 'get').and.callFake(() => hidden);
    const fixture = create();
    const loops = () =>
      (window.requestAnimationFrame as jasmine.Spy).calls
        .allArgs()
        .filter(([callback]) => callback.name === 'tick').length;
    const initial = loops();
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    gl.drawArrays.calls.reset();
    mode.effective.set('light');
    fixture.detectChanges();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(loops()).toBe(initial);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(loops()).toBe(initial + 1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    fixture.destroy();
    const afterDestroy = loops();
    document.dispatchEvent(new Event('visibilitychange'));
    events.dispatchEvent(new Event('change'));
    expect(loops()).toBe(afterDestroy);
  });
  it('stops the animation on explicit pause and resumes a single loop', () => {
    const fixture = create();
    const loops = () =>
      (window.requestAnimationFrame as jasmine.Spy).calls
        .allArgs()
        .filter(([callback]) => callback.name === 'tick').length;
    const initial = loops();
    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();
    expect(loops()).toBe(initial);
    gl.drawArrays.calls.reset();
    mode.effective.set('light');
    fixture.detectChanges();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(loops()).toBe(initial);
    fixture.componentRef.setInput('paused', false);
    fixture.detectChanges();
    expect(loops()).toBe(initial + 1);
    fixture.destroy();
  });
  it('reveals the fallback if shader linking fails', () => {
    gl.getProgramParameter = () => false;
    const fixture = create();
    expect(fixture.nativeElement.querySelector('canvas').style.opacity).toBe(
      '0',
    );
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it('keeps CSS fallback when WebGL is unavailable', () => {
    (HTMLCanvasElement.prototype.getContext as jasmine.Spy).and.returnValue(
      null,
    );
    const fixture = create();
    expect(gl.createProgram).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
