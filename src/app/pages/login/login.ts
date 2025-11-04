import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { AuthStore } from '../../core/auth/auth.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [UiInput, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  authStore = inject(AuthStore);
  router = inject(Router);

  email = '';
  password = '';

  async login(form: NgForm) {
    if (form.invalid) {
      alert('Preencha todos os campos');
      return;
    }

    await this.authStore.login(this.email, this.password);
    this.router.navigate(['/']);
  }
}
