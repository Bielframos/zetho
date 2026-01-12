import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { UserStore } from "../../../core/auth/user.store";
import { ListsController } from "../../../core/controllers/lists.controller";
import { UiModal } from "../../ui/molecules/modal/modal";
import { UiInput } from "../../ui/atoms/input/input";
import { UiCheckbox } from "../../ui/atoms/checkbox";

@Component({
    selector: 'app-new-list-dialog',
    standalone: true,
    templateUrl: './new-list-dialog.html',
    imports: [UiModal, UiInput, UiCheckbox, ReactiveFormsModule]
})
export class AppNewListDialog {
    private userStore = inject(UserStore);
    controller = inject(ListsController);

    form = new FormGroup({
        listName: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        listDescription: new FormControl('', { nonNullable: true }),
        isPublic: new FormControl(false)
    });

    async handleSubmit({ close }: { close: () => void }) {
        await this.controller.createList({
            ownerFingerprint: this.userStore.profile()?.fingerprint!,
            title: this.form.controls.listName.value,
            description: this.form.controls.listDescription.value,
            isPublic: this.form.controls.isPublic.value || undefined
        });

        close();
    }
}