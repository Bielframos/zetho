import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import { ZereiListItemRow } from '../../../../../types';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { UiEmptyState } from '../../../../../shared/ui/empty-state';
import { AppListCardMenu } from './list-card-menu';
import { ListController } from '../../../../lists/list.controller';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-draggable-list',
  templateUrl: './draggable-list.html',
  styleUrl: './draggable-list.css',
  imports: [
    CdkDropList,
    CdkDrag,
    UiGameCard,
    UiEmptyState,
    AppListCardMenu,
    CdkDragHandle,
    RouterLink,
  ],
})
export class UiDraggableList {
  controller = inject(ListController);
  itsMe = input<boolean>();

  drop(event: CdkDragDrop<string[]>) {
    const { previousIndex, currentIndex } = event;
    moveItemInArray(this.controller.items(), previousIndex, currentIndex);

    if (currentIndex === previousIndex) return;

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
