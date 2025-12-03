import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { UserStore } from '../../core/auth/user.store';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [UiInput, FormsModule, RouterLink],
  templateUrl: './login.html',
  host: {
    class: 'h-full'
  }
})
export class Login {
  userStore = inject(UserStore);
  router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false)
  result = signal<{ error?: boolean, message?: string }>({})

  async login(form: NgForm) {
    if (form.invalid) {
      alert('Preencha todos os campos');
      return;
    }

    this.isLoading.set(true)

    try {
      await this.userStore.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      if (e.code === 401) this.result.set({ error: true, message: 'Verifique o e-mail e senha inseridos.' })
      else if (e.code === 429) this.result.set({ error: true, message: 'Você realizou muitas tentativas em sequência. Para sua segurança, aguarde alguns minutos e tente novamente.' })
      else this.result.set({ error: true, message: 'Ocorreu um erro ao efetuar o login.' })
    }

    this.isLoading.set(false)
  }
}
