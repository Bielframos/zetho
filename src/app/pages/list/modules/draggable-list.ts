import { Component, inject } from '@angular/core';
import {
    CdkDrag,
    type CdkDragDrop,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ListController } from '../../../core/controllers/list.controller';
import { UiGameCard } from '../../../shared/ui/atoms/game-card/game-card';
import { ZereiListItemRow } from '../../../core/types';
import { AppListCardMenu } from './list-card-menu';
import { UserStore } from '../../../core/auth/user.store';
import { ProfileStore } from '../../../core/stores/profile.store';

@Component({
    selector: 'ui-draggable-list',
    templateUrl: './draggable-list.html',
    styleUrl: './draggable-list.css',
    imports: [CdkDropList, CdkDrag, UiGameCard, AppListCardMenu],
})
export class UiDraggableList {
    private userStore = inject(UserStore);
    private profileStore = inject(ProfileStore);
    controller = inject(ListController);

    get itsMe() {
        return this.userStore.profile()?.$id === this.profileStore.current()?.$id
    }

    drop(event: CdkDragDrop<string[]>) {
        const { previousIndex, currentIndex } = event;
        moveItemInArray(this.controller.items(), previousIndex, currentIndex);

        if (currentIndex === previousIndex) return

        const currentItem = this.controller.items().at(currentIndex)!;
        const prevItem = this.controller.items()[currentIndex - 1];
        const nextItem = this.controller.items().at(currentIndex + 1);

        this.controller.notifyReorder({
            item: currentItem as unknown as ZereiListItemRow,
            prevOrderKey: prevItem?.orderKey,
            nextOrderKey: nextItem?.orderKey,
        });
    }
}
