import { Component, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ListController } from '../../core/controllers/list.controller';
import { UiLoading } from '../../shared/ui/molecules/loading';
import { UiDraggableList } from './modules/draggable-list';
import { AppListMenu } from './modules/list-menu';

@Component({
    selector: 'app-list',
    standalone: true,
    templateUrl: './list.html',
    imports: [UiDraggableList, UiLoading, ReactiveFormsModule, AppListMenu],
})
export class List {
    private route = inject(ActivatedRoute);
    controller = inject(ListController);

    slug = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('slug'))),
        { initialValue: null },
    );



    constructor() {
        effect(() => {
            const slug = this.slug();

            if (slug) {
                untracked(() => {
                    void this.controller.load({ slug });
                });
            }
        });
    }
}
