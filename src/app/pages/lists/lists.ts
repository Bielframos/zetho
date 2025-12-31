import { Component, effect, inject, untracked } from "@angular/core";
import { ProfileLayoutStore } from "../../shared/app/profile-layout/profile-layout.store";
import { ListsController } from "../../core/controllers/lists.controller";
import { AppUserLists } from "../../shared/app/user-lists/user-lists";
import { AppNewListDialog } from "../../shared/app/new-list-dialog/new-list-dialog";
import { ProfileStore } from "../../core/stores/profile.store";

@Component({
    selector: 'app-lists',
    standalone: true,
    imports: [AppUserLists, AppNewListDialog],
    templateUrl: './lists.html'
})
export class Lists {
    profileStore = inject(ProfileStore)
    controller = inject(ListsController)

    constructor(private layoutStore: ProfileLayoutStore) {
        this.layoutStore.sidebarComponent.set(null)
        effect(() => {
            const userFingerprint = this.profileStore.current()?.fingerprint
            if (userFingerprint) {
                untracked(() => {
                    void this.controller.loadLists({ ownerFingerprint: userFingerprint })
                })
            }
        })
    }
}