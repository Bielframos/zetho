import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../admin.service';
import { AdminAddGameResponse, AdminApiError } from '../../admin.types';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiLoading } from '../../../../shared/ui/loading';

@Component({
  selector: 'app-admin-games-page',
  standalone: true,
  imports: [ReactiveFormsModule, UiInput, UiLoading],
  templateUrl: './admin-games.html',
})
export class AdminGamesPage {
  private adminService = inject(AdminService);

  igdbIdControl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });

  loading = signal(false);
  response = signal<AdminAddGameResponse | null>(null);
  error = signal<string | null>(null);

  async addGame(event?: SubmitEvent) {
    event?.preventDefault();

    this.igdbIdControl.markAsTouched();
    this.response.set(null);
    this.error.set(null);

    if (this.igdbIdControl.invalid || this.loading()) {
      return;
    }

    const igdbId = this.igdbIdControl.value;
    if (!igdbId) return;

    try {
      this.loading.set(true);
      const result = await this.adminService.addGameByIgdbId(igdbId);
      this.response.set(result);
      this.igdbIdControl.reset();
    } catch (e) {
      const apiError = e as AdminApiError;
      this.error.set(apiError.message);
    } finally {
      this.loading.set(false);
    }
  }
}
