import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { UserStore } from '../../core/auth/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [UiInput, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  userStore = inject(UserStore);
  router = inject(Router);

  email = '';
  password = '';

  async login(form: NgForm) {
    if (form.invalid) {
      alert('Preencha todos os campos');
      return;
    }

    await this.userStore.login(this.email, this.password);
    this.router.navigate(['/']);
  }
}
