import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { userGuardWithSsr } from './auth.guards';

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
