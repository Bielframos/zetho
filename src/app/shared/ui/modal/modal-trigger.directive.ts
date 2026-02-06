import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[modalTrigger]',
    standalone: true,
})
export class ModalTriggerDirective {
    onTrigger?: () => void;

    @HostListener('click')
    handleClick() {
        this.onTrigger?.();
    }
}
