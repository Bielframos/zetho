import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth.store';
import { UiModal } from '../../ui/modal/modal';
import { UiInput } from '../../ui/input/input';
import { ListsController } from '../../../core/lists/lists.controller';
import { UiCheckbox } from '../../ui/checkbox';

@Component({
  selector: 'app-new-list-dialog',
  standalone: true,
  templateUrl: './new-list-dialog.html',
  imports: [UiModal, UiInput, UiCheckbox, ReactiveFormsModule],
})
export class AppNewListDialog {
  private authStore = inject(AuthStore);
  controller = inject(ListsController);

  form = new FormGroup({
    listName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    listDescription: new FormControl('', { nonNullable: true }),
    isPublic: new FormControl(false),
  });

  async handleSubmit({ close }: { close: () => void }) {
    await this.controller.createList({
      ownerFingerprint: this.authStore.profile()?.fingerprint!,
      title: this.form.controls.listName.value,
      description: this.form.controls.listDescription.value,
      isPublic: this.form.controls.isPublic.value || undefined,
    });

    close();
  }
}
