import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthStore } from './auth.store';
import { userGuard, userGuardWithSsr } from './auth.guards';

describe('userGuardWithSsr', () => {
  it('allows the public recommendation shell to render on the server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const result = TestBed.runInInjectionContext(() =>
      userGuardWithSsr({} as never, []),
    );

    expect(await result).toBeTrue();
  });
});

describe('userGuard', () => {
  for (const authenticated of [false, true]) {
    it(`protects private pages when authenticated=${authenticated}`, async () => {
      let resolveReady!: () => void;
      const ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });
      const isAuthenticated = jasmine
        .createSpy()
        .and.returnValue(authenticated);
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthStore, useValue: { ready, isAuthenticated } },
        ],
      });
      const result = TestBed.runInInjectionContext(() =>
        userGuard({} as never, []),
      );
      expect(isAuthenticated).not.toHaveBeenCalled();
      resolveReady();
      const decision = await result;
      if (authenticated) {
        expect(decision).toBeTrue();
      } else {
        expect(TestBed.inject(Router).serializeUrl(decision as never)).toBe(
          '/landing',
        );
      }
    });
  }
});
