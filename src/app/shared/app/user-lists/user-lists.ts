import { Component, computed, inject, input } from '@angular/core';
import { UserStore } from '../../../core/auth/user.store';
import { ListsController } from '../../../core/controllers/lists.controller';
import { ProfileStore } from '../../../core/stores/profile.store';
import { ZereiListRow } from '../../../core/types';
import { UiListCard } from '../../ui/molecules/list-card';
import { AppNewListDialog } from '../new-list-dialog/new-list-dialog';

@Component({
    selector: 'app-user-lists',
    standalone: true,
    templateUrl: './user-lists.html',
    imports: [AppNewListDialog, UiListCard],
})
export class AppUserLists {
    userStore = inject(UserStore);
    profileStore = inject(ProfileStore);
    controller = inject(ListsController);
    lists = input<ZereiListRow[]>([]);

    disableGrid = input(false)
    fromMe = input(false);

    ownerGamertag = computed(() => {
        if (this.fromMe()) return this.userStore.profile()?.gamertag || '';
        else return this.profileStore.current()?.gamertag || '';
    });
}
