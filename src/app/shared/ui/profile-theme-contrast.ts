import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

/** Admin color inputs produce opaque hex. Legacy/custom unsupported CSS stays
 * in the artwork; export contrast calculations fall back to a known canvas. */
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

type ProfilePalette = { primaryColor?: string; secondaryColor?: string; tertiaryColor?: string };
const LOCAL_PROPERTIES = ['--gray-10', '--gray-11', '--gray-12', '--focus-ring'];

/** Keep the pre-appearance-mode palette scoped to equipped profiles. Theme
 * surfaces/transparency still come from the historical CSS, never this directive. */
@Directive({ selector: '[profileThemeBackground]' })
export class ProfileThemeContrast {
  profileThemeBackground = input<string | null | undefined>(null);
  profileThemePalette = input<ProfilePalette | null | undefined>(null);
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  constructor() {
    effect(() => {
      const background = this.profileThemeBackground();
      const equipped = !!background || !!this.profileThemePalette();
      const element = this.element.nativeElement;
      for (const name of LOCAL_PROPERTIES) this.renderer.removeStyle(element, name, 2);
      this.renderer.removeStyle(element, 'color');
      this.renderer.removeClass(element, 'color-mode-fixed-dark');
      if (!equipped) return;
      this.renderer.addClass(element, 'color-mode-fixed-dark');
      // Historical light text remains unchanged on dark themes. Light theme
      // backgrounds need only a foreground correction, never opaque text plates.
      if (background && profileForeground(background) === '#000000') {
        for (const name of ['--gray-10', '--gray-11', '--gray-12']) this.renderer.setStyle(element, name, '#000000', 2);
      }
      this.renderer.setStyle(element, 'color', 'var(--gray-12)');
      this.renderer.setStyle(element, '--focus-ring', 'var(--gray-12)', 2);
    });
  }
}
