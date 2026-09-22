import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GamePage } from './game';
import { GameController } from '../../game.controller';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../system/seo/seo.service';
import { RatingsService } from '../../../ratings/ratings.service';

describe('GamePage session restoration', () => {
  it('reloads the saved entry when the profile arrives, but not for balance updates', () => {
    const user = signal<any>(null);
    const profile = signal<any>(null);
    const loadPage = jasmine.createSpy('loadPage');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'example' })),
            queryParamMap: of(convertToParamMap({})),
          },
        },
        {
          provide: AuthStore,
          useValue: { user, profile, isAuthenticated: () => !!user() },
        },
        { provide: GameController, useValue: { loadPage, game: signal(null) } },
        { provide: SeoService, useValue: { clearJsonLd: () => {} } },
        { provide: RatingsService, useValue: {} },
      ],
    }).overrideComponent(GamePage, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(GamePage);
    fixture.detectChanges();
    expect(loadPage).toHaveBeenCalledTimes(1);
    user.set({ $id: 'user' });
    profile.set({ fingerprint: 'owner', zcoinBalance: 1 });
    fixture.detectChanges();
    expect(loadPage).toHaveBeenCalledTimes(2);
    profile.set({ fingerprint: 'owner', zcoinBalance: 2 });
    fixture.detectChanges();
    expect(loadPage).toHaveBeenCalledTimes(2);
    user.set(null);
    profile.set(null);
    fixture.detectChanges();
    expect(loadPage).toHaveBeenCalledTimes(3);
  });
});
