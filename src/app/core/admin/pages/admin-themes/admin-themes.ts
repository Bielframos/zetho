import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ThemesService } from '../../../themes/themes.service';
import { ProfileThemeType } from '../../../themes/themes.types';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiLoading } from '../../../../shared/ui/loading';

@Component({
  selector: 'z-admin-themes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiInput, UiLoading],
  templateUrl: './admin-themes.html',
})
export class AdminThemesPage {
  private title = inject(Title);
  private themesService = inject(ThemesService);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  themeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl<ProfileThemeType>('game', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    price: new FormControl<number>(100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    backgroundColor: new FormControl('', { nonNullable: true }),
    primaryColor: new FormControl('', { nonNullable: true }),
    secondaryColor: new FormControl('', { nonNullable: true }),
    tertiaryColor: new FormControl('', { nonNullable: true }),
  });

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor() {
    this.title.setTitle('Admin | Temas');
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.themeForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.themesService.createAdminTheme(
        {
          name: this.themeForm.controls.name.value,
          type: this.themeForm.controls.type.value,
          price: this.themeForm.controls.price.value,
          backgroundColor:
            this.themeForm.controls.backgroundColor.value || undefined,
          primaryColor: this.themeForm.controls.primaryColor.value || undefined,
          secondaryColor:
            this.themeForm.controls.secondaryColor.value || undefined,
          tertiaryColor:
            this.themeForm.controls.tertiaryColor.value || undefined,
        },
        this.selectedFile,
      );

      this.successMessage = 'Tema criado com sucesso!';
      this.themeForm.reset({ type: 'game', price: 100 });
      this.selectedFile = null;
      this.imagePreview = null;
    } catch (e: any) {
      this.errorMessage = e.message || 'Erro ao criar tema';
    } finally {
      this.isSubmitting = false;
    }
  }
}
