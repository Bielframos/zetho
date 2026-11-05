import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ZStatsService } from '../../../zStats/zStats.service';
import { LandingPage } from './lp';

describe('LandingPage', () => {
  let isAuthenticated = signal(false);
  let zStats: jasmine.SpyObj<ZStatsService>;

  beforeEach(() => {
    isAuthenticated = signal(false);
    zStats = jasmine.createSpyObj<ZStatsService>('ZStatsService', [
      'getTrendingGames',
    ]);
    zStats.getTrendingGames.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { isAuthenticated },
        },
        { provide: ZStatsService, useValue: zStats },
      ],
    });
  });

  it('renders the founders banner with prominent badge above the hero section', async () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const foundersBanner = root.querySelector<HTMLElement>(
      'section[aria-label="Edição Fundador"]',
    );
    const heroSection = root.querySelector<HTMLElement>(
      'section[aria-labelledby="landing-title"]',
    );

    expect(foundersBanner).not.toBeNull();
    expect(heroSection).not.toBeNull();
    expect(
      foundersBanner!.compareDocumentPosition(heroSection!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const badgeImg = foundersBanner!.querySelector<HTMLImageElement>('img');
    expect(badgeImg).not.toBeNull();
    expect(badgeImg!.src).toContain('/achievements/founder-badge/image');
    expect(
      foundersBanner!.querySelector('ui-shader-background'),
    ).not.toBeNull();
    expect(foundersBanner!.textContent).toContain('#0001 – #1000');

    const links = Array.from(foundersBanner!.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toContain('/registrar');
    expect(links).toContain('/fundadores');
  });

  it('falls back to the founder seal icon when the badge image fails to load', async () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      'section[aria-label="Edição Fundador"]',
    ) as HTMLElement;
    const badgeImg = banner.querySelector('img') as HTMLImageElement;
    badgeImg.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(banner.querySelector('img')).toBeNull();
    expect(banner.querySelector('.ph-seal-check')).not.toBeNull();
  });

  it('redirects authenticated visitors to the feed', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const fixture = TestBed.createComponent(LandingPage);
    isAuthenticated.set(true);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/feed');
  });
});
