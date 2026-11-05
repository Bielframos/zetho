import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiEmptyState } from './empty-state';

@Component({
  standalone: true,
  imports: [UiEmptyState],
  template: `
    <ui-empty-state
      [icon]="icon"
      [title]="title"
      [description]="description"
      [actionLabel]="actionLabel"
      [actionLink]="actionLink"
      [headingLevel]="headingLevel"
      [dashed]="dashed"
      (action)="onAction()"
    >
      <div id="projected-content">Custom projected element</div>
    </ui-empty-state>
  `,
})
class TestHostComponent {
  icon?: string;
  title = 'Nenhum item encontrado';
  description?: string;
  actionLabel?: string;
  actionLink?: string | any[];
  headingLevel: 'h1' | 'h2' | 'h3' | 'p' = 'h2';
  dashed = false;

  actionTriggered = false;

  onAction() {
    this.actionTriggered = true;
  }
}

describe('UiEmptyState', () => {
  describe('Direct component usage', () => {
    let fixture: ComponentFixture<UiEmptyState>;
    let component: UiEmptyState;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UiEmptyState],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(UiEmptyState);
      component = fixture.componentInstance;
    });

    it('should create the component', () => {
      fixture.componentRef.setInput('title', 'Título básico');
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render default h2 title and omit icon/description/action by default', () => {
      fixture.componentRef.setInput('title', 'Lista vazia');
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const h2 = element.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2?.textContent?.trim()).toBe('Lista vazia');
      expect(h2?.classList.contains('text-xl')).toBeTrue();
      expect(h2?.classList.contains('font-medium')).toBeTrue();
      expect(h2?.classList.contains('text-gray-12')).toBeTrue();

      expect(element.querySelector('i')).toBeNull();
      expect(element.querySelector('p')).toBeNull();
      expect(element.querySelector('button')).toBeNull();
      expect(element.querySelector('a')).toBeNull();
    });
  });

  describe('Integration with host component', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let rootEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      rootEl = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('should render the title with default h2 level', () => {
      const heading = rootEl.querySelector('h2');
      expect(heading?.textContent?.trim()).toBe('Nenhum item encontrado');
    });

    it('should respect custom heading levels (h1, h3, p)', () => {
      host.headingLevel = 'h1';
      fixture.detectChanges();
      expect(rootEl.querySelector('h1')?.textContent?.trim()).toBe('Nenhum item encontrado');
      expect(rootEl.querySelector('h2')).toBeNull();

      host.headingLevel = 'h3';
      fixture.detectChanges();
      expect(rootEl.querySelector('h3')?.textContent?.trim()).toBe('Nenhum item encontrado');
      expect(rootEl.querySelector('h1')).toBeNull();

      host.headingLevel = 'p';
      fixture.detectChanges();
      expect(rootEl.querySelector('p.font-medium')?.textContent?.trim()).toBe('Nenhum item encontrado');
    });

    it('should render icon with aria-hidden="true" when provided', () => {
      expect(rootEl.querySelector('i')).toBeNull();

      host.icon = 'ph ph-user-list';
      fixture.detectChanges();

      const icon = rootEl.querySelector('i');
      expect(icon).not.toBeNull();
      expect(icon?.classList.contains('ph')).toBeTrue();
      expect(icon?.classList.contains('ph-user-list')).toBeTrue();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render description when provided', () => {
      expect(rootEl.querySelector('p.text-sm')).toBeNull();

      host.description = 'Esta é uma descrição de teste para o estado vazio.';
      fixture.detectChanges();

      const desc = rootEl.querySelector('p.text-sm');
      expect(desc).not.toBeNull();
      expect(desc?.textContent?.trim()).toBe('Esta é uma descrição de teste para o estado vazio.');
      expect(desc?.classList.contains('text-gray-11')).toBeTrue();
    });

    it('should toggle dashed border styling according to dashed input', () => {
      const container = rootEl.querySelector('ui-empty-state > div');
      expect(container?.classList.contains('border-dashed')).toBeFalse();

      host.dashed = true;
      fixture.detectChanges();

      expect(container?.classList.contains('border')).toBeTrue();
      expect(container?.classList.contains('border-dashed')).toBeTrue();
      expect(container?.classList.contains('border-gray-6')).toBeTrue();
      expect(container?.classList.contains('rounded-lg')).toBeTrue();
    });

    it('should render primary button and emit action when actionLabel is set without actionLink', () => {
      host.actionLabel = 'Criar novo';
      fixture.detectChanges();

      const button = rootEl.querySelector('button.ui-primary-btn') as HTMLButtonElement | null;
      expect(button).not.toBeNull();
      expect(button?.textContent?.trim()).toBe('Criar novo');
      expect(rootEl.querySelector('a.ui-primary-btn')).toBeNull();

      expect(host.actionTriggered).toBeFalse();
      button?.click();
      expect(host.actionTriggered).toBeTrue();
    });

    it('should render link and emit action when actionLink and actionLabel are set', () => {
      host.actionLabel = 'Ir para a página';
      host.actionLink = '/explore';
      fixture.detectChanges();

      const link = rootEl.querySelector('a.ui-primary-btn') as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(link?.textContent?.trim()).toBe('Ir para a página');
      expect(rootEl.querySelector('button.ui-primary-btn')).toBeNull();

      expect(host.actionTriggered).toBeFalse();
      link?.click();
      expect(host.actionTriggered).toBeTrue();
    });

    it('should project custom ng-content', () => {
      const projected = rootEl.querySelector('#projected-content');
      expect(projected).not.toBeNull();
      expect(projected?.textContent?.trim()).toBe('Custom projected element');
    });
  });
});
