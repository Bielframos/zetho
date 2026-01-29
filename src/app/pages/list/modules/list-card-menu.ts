import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, inject, input, viewChild } from '@angular/core';
import {
  ListController,
  ZereiListItemRowExpanded,
} from '../../../core/lists/list.controller';

@Component({
  selector: 'app-list-card-menu',
  template: `
    <button
      ngMenuTrigger
      #origin
      #trigger="ngMenuTrigger"
      [menu]="formatMenu()"
      class="ui-action-btn absolute right-2 top-2 focus:ring-2 ring-blue-3 outline-none"
      data-size="icon"
    >
      <i class="ph ph-dots-three-vertical text-[16px]"></i>
    </button>

    <ng-template
      [cdkConnectedOverlayOpen]="trigger.expanded()"
      [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
      [cdkConnectedOverlayPositions]="[
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 4,
        },
      ]"
      cdkAttachPopoverAsChild
    >
      <div ngMenu class="menu" #formatMenu="ngMenu">
        <ng-template ngMenuContent>
          <div
            ngMenuItem
            value="Remover da lista"
            (click)="controller.removeItem(item())"
          >
            <i class="ph ph-trash" aria-hidden="true"> </i>
            <span class="label">Remover da lista</span>
          </div>
        </ng-template>
      </div>
    </ng-template>
  `,
  imports: [Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
})
export class AppListCardMenu {
  controller = inject(ListController);
  item = input.required<ZereiListItemRowExpanded>();
  formatMenu = viewChild<Menu<string>>('formatMenu');
}
