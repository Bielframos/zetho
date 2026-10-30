import { Router } from '@angular/router';
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
  authStore = inject(AuthStore);
  private router = inject(Router);
  controller = inject(ListsController);

  form = new FormGroup({
    listName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    listDescription: new FormControl('', { nonNullable: true }),
    isPublic: new FormControl(false),
    system: new FormControl(false),
  });

  async handleSubmit({ close }: { close: () => void }) {
    const created = await this.controller.createList({
      ownerType: this.form.controls.system.value ? 'system' : 'user',
      ownerFingerprint: this.authStore.profile()?.fingerprint!,
      title: this.form.controls.listName.value,
      description: this.form.controls.listDescription.value,
      isPublic: this.form.controls.isPublic.value || undefined,
    });

    if (!created) return;
    close();
    if (created.ownerType === 'system')
      await this.router.navigate(['/listas', created.slug]);
  }
}
