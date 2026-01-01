import { Component, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ListItemsController } from '../../core/controllers/listItems.controller';
import { UiDraggableList } from "./modules/draggable-list";
import { UiLoading } from "../../shared/ui/molecules/loading";

@Component({
    selector: 'app-list',
    standalone: true,
    imports: [UiDraggableList, UiLoading],
    templateUrl: './list.html',
})
export class List {
    private route = inject(ActivatedRoute);
    controller = inject(ListItemsController)

    slug = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('slug'))),
        { initialValue: null },
    );

    constructor() {
        effect(() => {
            const slug = this.slug()
            if (slug) {
                untracked(() => {
                    void this.controller.load({ slug })
                })
            }
        })
    }
}
