import { Component, inject, input } from '@angular/core';
import { ListsController } from '../../../core/controllers/lists.controller';
import { ZereiListRow } from '../../../core/types';
import { AppNewListDialog } from "../new-list-dialog/new-list-dialog";
import { UiListCard } from "../../ui/molecules/list-card";
import { UserStore } from '../../../core/auth/user.store';

@Component({
    selector: 'app-user-lists',
    standalone: true,
    templateUrl: './user-lists.html',
    imports: [AppNewListDialog, UiListCard],
})
export class AppUserLists {
    userStore = inject(UserStore);
    controller = inject(ListsController);
    lists = input<ZereiListRow[]>([]);

    get profile() {
        return this.userStore.profile()
    }
}
