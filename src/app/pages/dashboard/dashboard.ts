import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UserStore } from "../../core/auth/user.store";
import { ListsController } from "../../core/controllers/lists.controller";
import { DASHBOARD_ENTRIES } from "./utils";
import { ShortNumberPipe } from "../../core/modules/pipes";
import { AppUserLists } from "../../shared/app/user-lists/user-lists";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink, ShortNumberPipe, AppUserLists],
    templateUrl: './dashboard.html',
})
export class Dashboard {
    userStore = inject(UserStore)
    controller = inject(ListsController)

    get profile() { return this.userStore.profile() }
    entries = DASHBOARD_ENTRIES

    constructor() {
        void this.controller.loadLists({ userFingerprint: this.profile?.fingerprint! })
    }
}
