import { Component, computed, inject, signal } from '@angular/core';
import { AdminService } from '../../admin.service';
import { UiLoading } from '../../../../shared/ui/loading';
import {
  AdminApiError,
  AdminAuditAllResponse,
  AdminAuditOneResponse,
  AdminProfileItem,
} from '../../admin.types';

@Component({
  selector: 'app-admin-profiles-page',
  standalone: true,
  imports: [UiLoading],
  templateUrl: './admin-profiles.html',
})
export class AdminProfilesPage {
  private adminService = inject(AdminService);

  page = signal(1);
  limit = signal(20);
  total = signal(0);
  totalPages = signal(1);

  profiles = signal<AdminProfileItem[]>([]);

  listLoading = signal(false);
  batchLoading = signal(false);
  profileActionLoading = signal<string | null>(null);

  listError = signal<string | null>(null);
  batchActionResult = signal<AdminAuditAllResponse | null>(null);
  batchActionError = signal<string | null>(null);

  profileActionResult = signal<AdminAuditOneResponse | null>(null);
  profileActionError = signal<string | null>(null);

  paginationLabel = computed(() => {
    const current = this.page();
    const totalPages = this.totalPages();
    const total = this.total();
    return `Página ${current} de ${totalPages} (${total} perfis)`;
  });

  constructor() {
    void this.loadProfiles();
  }

  async loadProfiles() {
    this.listError.set(null);
    this.batchActionResult.set(null);

    try {
      this.listLoading.set(true);

      const result = await this.adminService.listProfiles(
        this.page(),
        this.limit(),
      );

      this.profiles.set(result.items);
      this.total.set(result.total);
      this.totalPages.set(Math.max(result.totalPages, 1));
      this.page.set(result.page);
      this.limit.set(result.limit);
    } catch (e) {
      const apiError = e as AdminApiError;
      this.listError.set(apiError.message);
    } finally {
      this.listLoading.set(false);
    }
  }

  async runBatchAudit(fix: boolean) {
    this.batchActionError.set(null);
    this.profileActionError.set(null);
    this.profileActionResult.set(null);

    try {
      this.batchLoading.set(true);
      const result = await this.adminService.auditAllProfiles(fix);
      this.batchActionResult.set(result);

      if (fix) {
        await this.loadProfiles();
      }
    } catch (e) {
      const apiError = e as AdminApiError;
      this.batchActionError.set(apiError.message);
    } finally {
      this.batchLoading.set(false);
    }
  }

  async runProfileAudit(profileId: string, fix: boolean) {
    this.profileActionError.set(null);
    this.batchActionError.set(null);

    try {
      this.profileActionLoading.set(profileId);
      const result = await this.adminService.auditProfile(profileId, fix);
      this.profileActionResult.set(result);

      if (fix) {
        await this.loadProfiles();
      }
    } catch (e) {
      const apiError = e as AdminApiError;
      this.profileActionError.set(apiError.message);
    } finally {
      this.profileActionLoading.set(null);
    }
  }

  async nextPage() {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update((value) => value + 1);
    await this.loadProfiles();
  }

  async prevPage() {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((value) => value - 1);
    await this.loadProfiles();
  }
}
