import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

/** Admin color inputs produce opaque hex. Legacy/custom unsupported CSS stays
 * in the artwork, but readable surfaces fall back to a known opaque canvas. */
export function profileReadableBackground(background: string) {
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(background) ? background : '#101113';
}

export function profileForeground(background: string) {
  const hex = profileReadableBackground(background).replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return '#ffffff';
  const channels = [0, 2, 4].map(i => parseInt(expanded.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  return luminance > .179 ? '#000000' : '#ffffff';
}

/** Profile artwork has its own color context, independent from interface mode. */
@Directive({ selector: '[profileThemeBackground]' })
export class ProfileThemeContrast {
  profileThemeBackground = input<string | null | undefined>(null);
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  constructor() {
    effect(() => {
      const themeBackground = this.profileThemeBackground();
      const background = themeBackground ? profileReadableBackground(themeBackground) : null;
      for (const name of ['--gray-1', '--gray-2', '--gray-3', '--gray-4', '--gray-10', '--gray-11', '--gray-12', '--blue-11', '--profile-readable-surface', '--focus-ring']) this.renderer.removeStyle(this.element.nativeElement, name, 2);
      this.renderer.removeStyle(this.element.nativeElement, 'color');
      if (!background) return;
      const foreground = profileForeground(background);
      this.renderer.setStyle(this.element.nativeElement, 'color', foreground);
      this.renderer.setStyle(this.element.nativeElement, '--focus-ring', foreground, 2);
      for (const name of ['--gray-1', '--gray-2', '--gray-3', '--gray-4']) this.renderer.setStyle(this.element.nativeElement, name, background, 2);
      for (const name of ['--gray-10', '--gray-11', '--gray-12', '--blue-11']) this.renderer.setStyle(this.element.nativeElement, name, foreground, 2);
      this.renderer.setStyle(this.element.nativeElement, '--profile-readable-surface', background, 2);
    });
  }
}
