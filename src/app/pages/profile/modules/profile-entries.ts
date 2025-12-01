import { Component, inject } from "@angular/core";
import { UserStore } from "../../../core/auth/user.store";
import { UiGameCard } from "../../../shared/ui/atoms/game-card/game-card";
import { UiLoading } from "../../../shared/ui/molecules/loading";
import { ZEntriesController } from "../../../core/controllers/zEntries.controller";


@Component({
    selector: 'ui-proflie-entries',
    standalone: true,
    imports: [UiLoading, UiGameCard],
    templateUrl: './profile-entries.html'
})
export class UiUserLibGrid {
    userStore = inject(UserStore)
    controller = inject(ZEntriesController)
}
