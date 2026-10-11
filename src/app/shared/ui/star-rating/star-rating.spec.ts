import { TestBed } from '@angular/core/testing';
import { AppStartingRating } from './star-rating';

describe('AppStartingRating', () => {
  it('supports half-star keyboard increments, endpoints and clearing without optimistic mutation', () => {
    const rating = new AppStartingRating();
    rating.value = 3;
    const emit = spyOn(rating.ratingChange, 'emit');
    rating.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(emit).toHaveBeenCalledWith(3.5);
    expect(rating.value).toBe(3);
    rating.onKeydown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(emit).toHaveBeenCalledWith(0);
    rating.onKeydown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(emit).toHaveBeenCalledWith(5);
  });

  it('handles a touch-generated click without requiring hover and exposes an accessible slider', () => {
    const fixture = TestBed.createComponent(AppStartingRating);
    fixture.componentInstance.label = 'Nota de um jogo';
    fixture.detectChanges();
    const slider = fixture.nativeElement.querySelector(
      '[role="slider"]',
    ) as HTMLElement;
    expect(slider.getAttribute('aria-label')).toBe('Nota de um jogo');
    expect(slider.tabIndex).toBe(0);
    const star = slider.querySelectorAll('span')[3] as HTMLElement;
    spyOn(star, 'getBoundingClientRect').and.returnValue({
      left: 0,
      width: 32,
    } as DOMRect);
    const emit = spyOn(fixture.componentInstance.ratingChange, 'emit');
    star.dispatchEvent(new MouseEvent('click', { clientX: 24, bubbles: true }));
    expect(emit).toHaveBeenCalledOnceWith(4);
  });

  it('keeps readonly and disabled values immutable', () => {
    const fixture = TestBed.createComponent(AppStartingRating);
    fixture.componentInstance.readonly = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="slider"]')).toBeNull();
    const emit = spyOn(fixture.componentInstance.ratingChange, 'emit');
    fixture.componentInstance.onKeydown(
      new KeyboardEvent('keydown', { key: 'End' }),
    );
    expect(emit).not.toHaveBeenCalled();
    fixture.componentInstance.readonly = false;
    fixture.componentInstance.disabled = true;
    fixture.componentInstance.onKeydown(
      new KeyboardEvent('keydown', { key: 'End' }),
    );
    expect(emit).not.toHaveBeenCalled();
  });
});
