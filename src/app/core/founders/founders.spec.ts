import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../system/seo/seo.service';
import { FoundersService } from './founders.service';
import { FoundersPage } from './founders';

describe('FoundersPage', () => {
  const founder = { profileId: 'p0', gamertag: 'Zero', number: 0, avatarUrl: 'https://example.com/avatar.png' };
  let service: jasmine.SpyObj<FoundersService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('FoundersService', ['list']);
    TestBed.configureTestingModule({
      imports: [FoundersPage],
      providers: [
        provideRouter([]),
        { provide: FoundersService, useValue: service },
        { provide: SeoService, useValue: { apply: jasmine.createSpy('apply') } },
      ],
    });
  });

  it('renders every founder, including number zero, with a profile link and avatar fallback', async () => {
    service.list.and.resolveTo(Array.from({ length: 1001 }, (_, number) => ({
      ...founder, number, profileId: `p${number}`, gamertag: number ? `Player${number}` : 'Zero',
    })));
    const fixture = TestBed.createComponent(FoundersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('li').length).toBe(1001);
    expect(element.querySelector('li a')?.getAttribute('href')).toBe('/player/Zero');
    const firstFounder = element.querySelector('li')!;
    firstFounder.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(firstFounder.querySelector('img')).toBeNull();
    expect(firstFounder.textContent).toContain('Z');
  });

  it('shows a retry after failure and an empty state when the retry succeeds without founders', async () => {
    service.list.and.rejectWith(new Error('Offline'));
    const fixture = TestBed.createComponent(FoundersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível');
    service.list.and.resolveTo([]);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Carregando fundadores');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum fundador disponível');
  });
});
