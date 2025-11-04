import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { AuthStore } from '../../core/auth/auth.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [UiInput, FormsModule],
  templateUrl: './register.html',
})
export class Register {
  authService = inject(AuthService);
  authStore = inject(AuthStore);
  router = inject(Router);

  name = '';
  gamertag = '';
  email = '';
  password = '';
  confirmPassword = '';

  async register(form: NgForm) {
    if (form.invalid) {
      alert('Preencha todos os campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('As senhas não são iguais');
      return;
    }

    await this.authService.register(this.email, this.password, this.name, this.gamertag);
    this.authStore.refresh();
    this.router.navigate(['/']);
  }
}
