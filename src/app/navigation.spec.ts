import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { DASHBOARD_ROUTES } from './core/dashboard/dashboard.routes';
import { AuthStore } from './core/auth/auth.store';

@Component({ template: '' })
class Page {}

describe('Feed navigation', () => {
  for (const authenticated of [true, false]) {
    it(`redirects legacy URLs and applies session guard (authenticated=${authenticated})`, async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            DASHBOARD_ROUTES[0],
            { ...DASHBOARD_ROUTES[1], component: Page },
            { path: 'landing', component: Page },
          ]),
          {
            provide: AuthStore,
            useValue: {
              ready: Promise.resolve(),
              isAuthenticated: () => authenticated,
            },
          },
        ],
      });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/dashboard?q=zelda&scope=following#latest');
      expect(TestBed.inject(Router).url).toBe(
        authenticated ? '/feed?q=zelda&scope=following#latest' : '/landing',
      );
      await harness.navigateByUrl('/feed');
      expect(TestBed.inject(Router).url).toBe(
        authenticated ? '/feed' : '/landing',
      );
    });
  }
});

describe('Global search shortcut', () => {
  function setup(path: string, shell = true) {
    const input = document.createElement('input');
    input.dataset['searchInput'] = '';
    document.body.append(input);
    const navigate = jasmine.createSpy('navigate');
    const context = {
      usesAppShell: () => shell,
      currentPath: () => path,
      closeMobileMenu: jasmine.createSpy('closeMobileMenu'),
      document,
      route: { navigate },
    };
    return { input, navigate, context };
  }
  for (const modifier of ['ctrlKey', 'metaKey']) {
    it(`opens search using ${modifier} even from an input`, () => {
      const { input, navigate, context } = setup('/feed');
      input.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        [modifier]: true,
        cancelable: true,
      });
      App.prototype.onSearchShortcut.call(context as unknown as App, event);
      expect(event.defaultPrevented).toBeTrue();
      expect(navigate).toHaveBeenCalledOnceWith(['/buscar']);
      input.remove();
    });
  }
  it('focuses existing search without navigation or losing filters', () => {
    const { input, navigate, context } = setup('/buscar');
    input.value = 'Zelda';
    App.prototype.onSearchShortcut.call(
      context as unknown as App,
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
    );
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Zelda');
    expect(navigate).not.toHaveBeenCalled();
    input.remove();
  });
  it('leaves shortcuts outside the AppShell untouched', () => {
    const { input, navigate, context } = setup('/entrar', false);
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      cancelable: true,
    });
    App.prototype.onSearchShortcut.call(context as unknown as App, event);
    expect(event.defaultPrevented).toBeFalse();
    expect(navigate).not.toHaveBeenCalled();
    input.remove();
  });
});

describe('Onboarding navigation shell', () => {
  it('uses a focused shell only on the onboarding route', () => {
    expect(
      App.prototype.isOnboardingRoute.call({
        currentPath: () => '/comecar',
      } as unknown as App),
    ).toBeTrue();
    expect(
      App.prototype.isOnboardingRoute.call({
        currentPath: () => '/feed',
      } as unknown as App),
    ).toBeFalse();
  });
});
