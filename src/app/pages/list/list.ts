import { Component, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ListItemsController } from '../../core/controllers/listItems.controller';
import { UiLoading } from '../../shared/ui/molecules/loading';
import { UiDraggableList } from './modules/draggable-list';
import { UiModal } from '../../shared/ui/molecules/modal/modal';
import { ModalTriggerDirective } from '../../shared/ui/molecules/modal/modal-trigger.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiCheckbox } from '../../shared/ui/atoms/checkbox';
import { UiInput } from '../../shared/ui/atoms/input/input';

@Component({
    selector: 'app-list',
    standalone: true,
    templateUrl: './list.html',
    imports: [
        UiDraggableList,
        UiLoading,
        UiModal,
        ModalTriggerDirective,
        ReactiveFormsModule,
        UiCheckbox,
        UiInput,
    ],
})
export class List {
    private route = inject(ActivatedRoute);
    controller = inject(ListItemsController);

    slug = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('slug'))),
        { initialValue: null },
    );

    form = new FormGroup({
        listName: new FormControl('', { nonNullable: true }),
        listDescription: new FormControl('', { nonNullable: true }),
        isPublic: new FormControl(false, { nonNullable: true }),
    });

    async handleUpdateList({ close }: { close: () => void }) {
        const data = this.form.getRawValue();
        await this.controller.updateList({
            title: data.listName,
            description: data.listDescription,
            isPublic: data.isPublic,
        });

        close();
    }

    constructor() {
        effect(() => {
            const slug = this.slug();

            if (slug) {
                untracked(() => {
                    void this.controller.load({ slug });
                });
            }
        });

        effect(() => {
            const list = this.controller.list();

            if (!list) return;

            untracked(() => {
                this.form.patchValue({
                    listName: list.title,
                    listDescription: list.description,
                    isPublic: list.isPublic,
                });
            });
        });
    }
}
