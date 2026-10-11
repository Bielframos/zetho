import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SearchPage } from './search';
import { AuthStore } from '../../../auth/auth.store';
import { SearchController } from '../../search.controller';
import { GameService } from '../../../games/games.service';
import { GenresCacheService } from '../../../games/genres-cache.service';
import { SeoService } from '../../../system/seo/seo.service';

describe('Search focus after sheet navigation', () => {
  it('waits for the outgoing mobile menu before focusing the new search input', async () => {
    TestBed.configureTestingModule({ imports: [SearchPage], providers: [
      provideRouter([]),
      { provide: AuthStore, useValue: {} },
      { provide: SearchController, useValue: { reset: () => {} } },
      { provide: GameService, useValue: {} },
      { provide: GenresCacheService, useValue: { options: signal([]), ensureLoaded: async () => {} } },
      { provide: SeoService, useValue: { apply: () => {} } },
    ] });
    TestBed.overrideComponent(SearchPage, { set: { template: '<input #searchInput data-search-input />' } });
    const menu = document.createElement('dialog');
    menu.innerHTML = '<button>Buscar</button>';
    document.body.append(menu);
    menu.showModal();
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input');
    expect(document.activeElement).not.toBe(input);
    menu.close();
    // Native close is queued by the browser, matching the sheet exit lifecycle.
    await new Promise<void>((resolve) => menu.addEventListener('close', () => resolve(), { once: true }));
    expect(document.activeElement).toBe(input);
    fixture.destroy();
    menu.remove();
  });
});
