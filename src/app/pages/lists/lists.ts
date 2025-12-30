import { Component } from "@angular/core";
import { ProfileLayoutStore } from "../../shared/app/profile-layout/profile-layout.store";

@Component({
    selector: 'app-lists',
    standalone: true,
    imports: [],
    templateUrl: './lists.html'
})
export class Lists {
    constructor(private layoutStore: ProfileLayoutStore) {
        this.layoutStore.sidebarComponent.set(null)
    }
}