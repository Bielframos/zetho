import { TestBed } from '@angular/core/testing';
import { UiSidebar } from './sidebar';

describe('UiSidebar', () => {
  it('opens in the top layer and restores scrolling when dismissed with Escape', () => {
    const fixture = TestBed.createComponent(UiSidebar);
    const previousOverflow = document.body.style.overflow;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    expect(panel.matches(':modal')).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');

    panel.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(panel.open).toBeFalse();
    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.body.style.overflow).toBe(previousOverflow);
    fixture.destroy();
  });

  it('only dismisses clicks outside the panel and releases scrolling on destruction', () => {
    const fixture = TestBed.createComponent(UiSidebar);
    const previousOverflow = document.body.style.overflow;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    const bounds = panel.getBoundingClientRect();

    panel.dispatchEvent(new MouseEvent('click', { clientX: bounds.left + 1, clientY: bounds.top + 1 }));
    expect(panel.open).toBeTrue();
    panel.dispatchEvent(new MouseEvent('click', { clientX: bounds.left - 1, clientY: bounds.top + 1 }));
    expect(panel.open).toBeFalse();

    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    expect(panel.matches(':modal')).toBeTrue();
    fixture.destroy();
    expect(document.body.style.overflow).toBe(previousOverflow);
  });
});
