import { TestBed } from '@angular/core/testing';
import { FounderDirectory, UiFounderBadge } from './founder-badge';
import { SocialApi } from '../infra/social-api';

describe('Founder identity', () => {
  const requestPublic = jasmine.createSpy('requestPublic');
  beforeEach(() => {
    requestPublic.calls.reset();
    requestPublic.and.resolveTo([
      { gamertag: 'Zero', number: 0 },
      { gamertag: 'Player', number: 1000 },
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: SocialApi, useValue: { requestPublic } }],
    });
  });
  it('loads the directory once for concurrent identities and preserves number zero', async () => {
    const directory = TestBed.inject(FounderDirectory);
    await Promise.all([directory.load(), directory.load(), directory.load()]);
    expect(requestPublic).toHaveBeenCalledTimes(1);
    expect(directory.numbers().get('Zero')).toBe(0);
    await directory.load();
    expect(requestPublic).toHaveBeenCalledTimes(1);
  });
  it('displays the founder seal and padded number even for #0000', async () => {
    await TestBed.inject(FounderDirectory).load();
    const fixture = TestBed.createComponent(UiFounderBadge);
    fixture.componentRef.setInput('gamertag', 'Zero');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('#0000');
    expect(fixture.nativeElement.textContent).not.toContain('Fundador');
    expect(fixture.nativeElement.querySelector('[aria-label="Fundador #0000"]')).not.toBeNull();
    const image = fixture.nativeElement.querySelector(
      'img',
    ) as HTMLImageElement;
    expect(image.src).toContain('/achievements/founder-badge/image');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('i.ph-seal-check'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('#0000');
    fixture.componentRef.setInput('gamertag', 'Player');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('#1000');
    fixture.componentRef.setInput('gamertag', 'Other');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
  it('ignores directory responses that predate a verification refresh', async () => {
    const directory = TestBed.inject(FounderDirectory);
    let finish!: (rows: { gamertag: string; number: number }[]) => void;
    requestPublic.and.returnValue(new Promise((resolve) => (finish = resolve)));
    const stale = directory.load();
    directory.invalidate();
    requestPublic.and.resolveTo([{ gamertag: 'Zero', number: 0 }]);
    await directory.load();
    finish([{ gamertag: 'Removed', number: 12 }]);
    await stale;
    expect(directory.numbers().get('Zero')).toBe(0);
    expect(directory.numbers().has('Removed')).toBeFalse();
  });

  it('recovers after a failed directory request without inventing identities', async () => {
    const directory = TestBed.inject(FounderDirectory);
    requestPublic.and.rejectWith(new Error('offline'));
    await directory.load();
    expect(directory.numbers().size).toBe(0);
    requestPublic.and.resolveTo([{ gamertag: 'Zero', number: 0 }]);
    await directory.load();
    expect(directory.numbers().get('Zero')).toBe(0);
  });
});
