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

type ProfilePalette = { primaryColor?: string; secondaryColor?: string; tertiaryColor?: string };
const LOCAL_PROPERTIES = ['--gray-1', '--gray-2', '--gray-3', '--gray-4', '--gray-6', '--gray-10', '--gray-11', '--gray-12', '--blue-11', '--profile-readable-surface', '--profile-accent-surface', '--profile-accent-content', '--profile-badge-surface', '--profile-badge-content', '--profile-border-color', '--focus-ring'];
function opaqueColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value) ? value : fallback;
}
function surfaceShade(background: string, foreground: string, amount: number) {
  const hex = background.slice(1);
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  // Move surfaces away from the foreground so their contrast cannot decrease.
  const toward = foreground === '#000000' ? 255 : 0;
  return '#' + [0, 2, 4].map(i => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount) + toward * amount).toString(16).padStart(2, '0')).join('');
}

/** Artwork and equipped colors remain independent from the global interface mode.
 * Opaque surfaces are applied to text/control groups, never the whole artwork layer. */
@Directive({ selector: '[profileThemeBackground]' })
export class ProfileThemeContrast {
  profileThemeBackground = input<string | null | undefined>(null);
  profileThemePalette = input<ProfilePalette | null | undefined>(null);
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  constructor() {
    effect(() => {
      const themeBackground = this.profileThemeBackground();
      const palette = this.profileThemePalette();
      const background = themeBackground || palette ? profileReadableBackground(themeBackground ?? '') : null;
      for (const name of LOCAL_PROPERTIES) this.renderer.removeStyle(this.element.nativeElement, name, 2);
      this.renderer.removeStyle(this.element.nativeElement, 'color');
      if (!background) return;
      const foreground = profileForeground(background);
      const primary = opaqueColor(palette?.primaryColor, '#3e63dd');
      const secondary = opaqueColor(palette?.secondaryColor, primary);
      const tertiary = opaqueColor(palette?.tertiaryColor, surfaceShade(background, foreground, .14));
      const properties: Record<string, string> = {
        '--gray-1': background,
        '--gray-2': surfaceShade(background, foreground, .03),
        '--gray-3': surfaceShade(background, foreground, .08),
        '--gray-4': surfaceShade(background, foreground, .14),
        '--gray-6': foreground,
        '--gray-10': foreground, '--gray-11': foreground, '--gray-12': foreground, '--blue-11': foreground,
        '--focus-ring': foreground,
        '--profile-readable-surface': background,
        '--profile-accent-surface': primary,
        '--profile-accent-content': profileForeground(primary),
        '--profile-badge-surface': tertiary,
        '--profile-badge-content': profileForeground(tertiary),
        '--profile-border-color': secondary,
      };
      this.renderer.setStyle(this.element.nativeElement, 'color', foreground);
      for (const [name, value] of Object.entries(properties)) this.renderer.setStyle(this.element.nativeElement, name, value, 2);
    });
  }
}
