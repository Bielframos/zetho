import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UiSidebar } from './sidebar';

describe('UiSidebar', () => {
  it('opens in the top layer and restores scrolling when dismissed with Escape', fakeAsync(() => {
    const fixture = TestBed.createComponent(UiSidebar);
    const previousOverflow = document.body.style.overflow;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;

    expect(panel.matches(':modal')).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');

    panel.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(panel.open).toBeTrue();
    fixture.detectChanges();
    tick(220);
    expect(panel.open).toBeFalse();
    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.body.style.overflow).toBe(previousOverflow);
    fixture.destroy();
  }));

  it('only dismisses clicks outside the panel and releases scrolling on destruction', fakeAsync(() => {
    const fixture = TestBed.createComponent(UiSidebar);
    const previousOverflow = document.body.style.overflow;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    const bounds = panel.getBoundingClientRect();

    panel.dispatchEvent(
      new MouseEvent('click', {
        clientX: bounds.left + 1,
        clientY: bounds.top + 1,
      }),
    );
    expect(panel.open).toBeTrue();
    panel.dispatchEvent(
      new MouseEvent('click', {
        clientX: bounds.left - 1,
        clientY: bounds.top + 1,
      }),
    );
    expect(panel.open).toBeTrue();
    fixture.detectChanges();
    tick(220);
    expect(panel.open).toBeFalse();

    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    expect(panel.matches(':modal')).toBeTrue();
    fixture.destroy();
    expect(document.body.style.overflow).toBe(previousOverflow);
  }));
});

describe('Sheet lifecycle', () => {
  it('cancels pending exit when reopened and releases nested scroll locks independently', fakeAsync(() => {
    const first = TestBed.createComponent(UiSidebar);
    const second = TestBed.createComponent(UiSidebar);
    document.body.append(first.nativeElement, second.nativeElement);
    const overflow = document.body.style.overflow;
    for (const fixture of [first, second]) {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    }
    first.componentInstance.close();
    first.detectChanges();
    tick(100);
    first.componentInstance.isOpen.set(true);
    first.detectChanges();
    tick(220);
    expect(
      first.nativeElement.querySelector('dialog').matches(':modal'),
    ).toBeTrue();
    second.destroy();
    expect(document.body.style.overflow).toBe('hidden');
    first.componentInstance.close();
    first.detectChanges();
    tick(220);
    expect(first.nativeElement.querySelector('dialog').open).toBeFalse();
    expect(document.body.style.overflow).toBe(overflow);
    first.destroy();
  }));

  it('restores the trigger focus only after exit and closes immediately for reduced motion', fakeAsync(() => {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    const fixture = TestBed.createComponent(UiSidebar);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('dialog');
    fixture.componentInstance.close();
    fixture.detectChanges();
    expect(panel.matches(':modal')).toBeTrue();
    tick(220);
    expect(document.activeElement).toBe(button);
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as MediaQueryList);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    fixture.componentInstance.close();
    fixture.detectChanges();
    expect(panel.open).toBeFalse();
    fixture.destroy();
    button.remove();
  }));
});
