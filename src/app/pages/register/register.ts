import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/appwrite/auth.service';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [UiInput, FormsModule],
  templateUrl: './register.html',
})
export class Register {
  authService = inject(AuthService);

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
  }
}
