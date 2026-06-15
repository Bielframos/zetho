import { Component, effect, inject, signal, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { appwrite } from '../../../../appwrite/appwrite.client';
import { AuthStore } from '../../../../auth/auth.store';
import { GameStore } from '../../../game.store';
import { GameController } from '../../../game.controller';
import { RatingsService, RatingRow } from '../../../../ratings/ratings.service';
import { RichTextEditorComponent } from '../../../../../shared/ui/rich-text-editor/rich-text-editor';
import { AppStartingRating } from '../../../../../shared/ui/star-rating/star-rating';

@Component({
  selector: 'ui-game-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RichTextEditorComponent,
    AppStartingRating,
  ],
  template: `
    <article class="flex flex-col gap-6 max-md:px-4">
      <header class="flex gap-4 items-center justify-between">
        <div class="flex gap-4 items-center">
          <div class="h-10 w-10 flex items-center justify-center rounded-full bg-blue-3">
            <i class="ph ph-star-half text-blue-9 text-[24px]"></i>
          </div>
          <div>
            <h3 class="text-blue-12 text-2xl">Críticas e Avaliações</h3>
            <small class="text-gray-11">Veja o que outros jogadores acharam e deixe sua opinião estruturada</small>
          </div>
        </div>

        @if (authStore.isAuthenticated() && !gameController.isUpcomingRelease()) {
          <button
            class="ui-primary-btn"
            (click)="toggleForm()"
          >
            {{ showForm() ? 'Voltar para críticas' : (myRating() ? 'Editar minha crítica' : 'Escrever crítica') }}
          </button>
        }
      </header>

      <!-- Formulário de Crítica (Tiptap + Stars) -->
      @if (showForm()) {
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-2">
            <span class="text-sm text-gray-11">Sua Nota (0.5 a 5 estrelas):</span>
            <app-star-rating
              [value]="editRating()"
              (ratingChange)="onRatingChange($event)"
            ></app-star-rating>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-gray-11">Título ou Resumo Rápido (máx. 255 caracteres):</span>
            <input
              type="text"
              placeholder="Ex: Obra de arte indiscutível!, Bom mas com bugs..."
              maxlength="255"
              class="rounded-xl px-4 py-2 font-light bg-gray-3 border border-gray-6 text-gray-12 outline-none focus:ring-2 focus:ring-blue-6 transition-all duration-200"
              [(ngModel)]="editTitle"
            />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-11">Crítica Detalhada (Rich Text):</span>
              @if (editContent().length > 100) {
                <small class="text-green-400">
                  <i class="ph ph-sparkle"></i> Crítica qualificada (+5 Z-Coins!)
                </small>
              }
            </div>
            <!-- Componente RichTextEditor encapsulado com Tiptap -->
            <app-rich-text-editor
              [content]="editContent()"
              (contentChange)="onContentChange($event)"
              placeholder="Escreva sua análise detalhada. Use negrito, citações, listas e blocos de código para formatar..."
            ></app-rich-text-editor>
          </div>

          <div class="flex justify-between items-center mt-2">
            <div>
              @if (myRating()) {
                <button
                  class="ui-destructive-btn px-4 py-1"
                  [disabled]="submitting()"
                  (click)="deleteReview()"
                >
                  Excluir crítica
                </button>
              }
            </div>
            <div class="flex gap-2">
              <button
                class="ui-secondary-btn px-4 py-1"
                [disabled]="submitting()"
                (click)="toggleForm()"
              >
                Cancelar
              </button>
              <button
                class="ui-primary-btn px-4 py-1"
                [disabled]="submitting() || editRating() === 0"
                (click)="submitReview()"
              >
                @if (submitting()) {
                  <i class="ph ph-spinner animate-spin"></i>
                }
                Publicar Crítica
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Feed de Avaliações -->
        <div class="flex flex-col gap-6 divide-y divide-gray-6">
          @if (loading() && ratings().length === 0 && !myRating()) {
            <div class="py-10 flex flex-col items-center justify-center text-gray-11">
              <i class="ph ph-spinner animate-spin text-4xl mb-2 text-blue-9"></i>
              <p>Carregando avaliações...</p>
            </div>
          } @else {
            <!-- Minha própria avaliação em destaque -->
          @if (myRating(); as mine) {
            <div class="pt-6 first:pt-0 flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <div class="flex text-amber-300">
                  @for (star of getStarsArray(mine.rating); track $index) {
                    <i class="ph-fill ph-star"></i>
                  }
                  @if (mine.rating % 1 !== 0) {
                    <i class="ph-fill ph-star-half"></i>
                  }
                </div>
                <span class="font-bold text-gray-12">{{ mine.rating.toFixed(1) }}</span>
              </div>
              @if (mine.title) {
                <h4 class="font-medium text-lg text-gray-12">"{{ mine.title }}"</h4>
              }
              @if (mine.content) {
                <div class="prose prose-invert prose-gray max-w-none prose-p:font-light" [innerHTML]="mine.content"></div>
              }
              <footer class="flex gap-3 items-center mt-2 pt-4">
                <img
                  [src]="getAvatar(mine.profile)"
                  alt="Avatar"
                  class="h-8 w-8 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <div class="flex gap-2 items-center">
                    <span class="text-gray-12 font-medium text-base">{{ mine.profile?.gamertag || 'Você' }}</span>
                    <span class="text-[10px] bg-blue-9 text-white px-1.5 py-0.5 rounded-full font-medium">Sua Crítica</span>
                  </div>
                  <span class="text-xs text-gray-10">{{ mine.$createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="ml-auto flex items-center gap-2 text-sm text-gray-11">
                  <button class="hover:text-blue-9 transition-colors" (click)="voteReview(mine, 'up')">
                    <i class="ph ph-caret-up text-lg"></i>
                  </button>
                  <span class="min-w-4 text-center font-medium">{{ mine.voteCount || 0 }}</span>
                  <button class="hover:text-blue-9 transition-colors" (click)="voteReview(mine, 'down')">
                    <i class="ph ph-caret-down text-lg"></i>
                  </button>
                </div>
              </footer>
            </div>
          }

          <!-- Outras avaliações -->
          @if (ratings().length === 0 && !myRating()) {
            <div class="py-10 text-center rounded-2xl text-gray-11 border border-dashed border-gray-6">
              <i class="ph ph-medal text-4xl mb-2 text-gray-9"></i>
              <p>Nenhuma review publicada para este jogo ainda.</p>
              @if (authStore.isAuthenticated()) {
                <p class="text-sm mt-1">Seja o primeiro a escrever uma review e ganhe Z-Coins!</p>
              }
            </div>
          }

          @for (review of ratings(); track review.$id) {
            <div class="pt-6 first:pt-0 flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <div class="flex text-amber-300">
                  @for (star of getStarsArray(review.rating); track $index) {
                    <i class="ph-fill ph-star"></i>
                  }
                  @if (review.rating % 1 !== 0) {
                    <i class="ph-fill ph-star-half"></i>
                  }
                </div>
                <span class="font-bold text-gray-12">{{ review.rating.toFixed(1) }}</span>
              </div>
              @if (review.title) {
                <h4 class="font-medium text-lg text-gray-12">"{{ review.title }}"</h4>
              }
              @if (review.content) {
                <div class="prose prose-invert prose-gray max-w-none prose-p:font-light" [innerHTML]="review.content"></div>
              }
              <footer class="flex gap-3 items-center mt-2 pt-4">
                <a class="flex items-center gap-3" [routerLink]="['/player', review.profile?.gamertag]">
                  <img
                    [src]="getAvatar(review.profile)"
                    alt="Avatar"
                    class="h-8 w-8 rounded-full object-cover"
                  />
                  <div class="flex flex-col">
                    <span class="text-gray-12 font-medium text-base hover:underline">{{ review.profile?.gamertag || 'Jogador Zetho' }}</span>
                    <span class="text-xs text-gray-10">{{ review.$createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </a>
                <div class="ml-auto flex items-center gap-2 text-sm text-gray-11">
                  <button class="hover:text-blue-9 transition-colors" (click)="voteReview(review, 'up')">
                    <i class="ph ph-caret-up text-lg"></i>
                  </button>
                  <span class="min-w-4 text-center font-medium">{{ review.voteCount || 0 }}</span>
                  <button class="hover:text-blue-9 transition-colors" (click)="voteReview(review, 'down')">
                    <i class="ph ph-caret-down text-lg"></i>
                  </button>
                </div>
              </footer>
            </div>
          }

          @if (hasMore()) {
            <footer class="w-full flex justify-center pt-6">
              <button class="ui-primary-btn" (click)="loadMore()">
                @if (loading()) {
                  <i class="ph ph-spinner animate-spin"></i>
                }
                Carregar mais críticas
              </button>
            </footer>
          }
          }
        </div>
      }
    </article>
  `,
  styles: `
  `
})
export class UiGameReviews implements OnInit {
  ratingsService = inject(RatingsService);
  gameStore = inject(GameStore);
  authStore = inject(AuthStore);
  gameController = inject(GameController);

  ratings = signal<RatingRow[]>([]);
  myRating = signal<RatingRow | null>(null);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(false);
  submitting = signal(false);
  showForm = signal(false);

  // Campos de edição
  editRating = signal<number>(0);
  editTitle = signal<string>('');
  editContent = signal<string>('');

  constructor() {
    effect(() => {
      const gameId = this.gameStore.currentGame()?.$id;
      if (!gameId) return;

      untracked(() => {
        this.resetState();
        void this.loadPage();
        void this.loadMyRating();
      });
    });
  }

  ngOnInit(): void {
    // Carregamento inicial já feito pelo effect
  }

  resetState() {
    this.ratings.set([]);
    this.myRating.set(null);
    this.page.set(1);
    this.totalPages.set(1);
    this.showForm.set(false);
    this.clearEditFields();
  }

  clearEditFields() {
    this.editRating.set(0);
    this.editTitle.set('');
    this.editContent.set('');
  }

  async loadPage() {
    const game = this.gameStore.currentGame();
    if (!game) return;

    this.loading.set(true);
    try {
      const res = await this.ratingsService.getRatings(game.$id, this.page(), 8);
      // Filtrar minha própria avaliação da listagem geral
      const otherReviews = res.items.filter(r => r.ownerFingerprint !== this.myRating()?.ownerFingerprint);
      this.ratings.update(prev => [...prev, ...otherReviews]);
      this.totalPages.set(res.totalPages);
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMyRating() {
    const game = this.gameStore.currentGame();
    if (!game || !this.authStore.isAuthenticated()) return;

    try {
      const mine = await this.ratingsService.getMyRating(game.$id);
      this.myRating.set(mine);

      // Remover minha avaliação do feed principal se ela já estiver lá
      if (mine) {
        this.ratings.update(list => list.filter(r => r.$id !== mine.$id));
      }
    } catch (err) {
      console.error('Erro ao buscar minha avaliação:', err);
    }
  }

  toggleForm() {
    this.showForm.update(val => !val);
    if (this.showForm()) {
      const mine = this.myRating();
      if (mine) {
        this.editRating.set(mine.rating);
        this.editTitle.set(mine.title || '');
        this.editContent.set(mine.content || '');
      } else {
        this.clearEditFields();
      }
    }
  }

  editMyRating(mine: RatingRow) {
    this.editRating.set(mine.rating);
    this.editTitle.set(mine.title || '');
    this.editContent.set(mine.content || '');
    this.showForm.set(true);
  }

  onRatingChange(rating: number) {
    this.editRating.set(rating);
  }

  onContentChange(content: string) {
    this.editContent.set(content);
  }

  async submitReview() {
    const game = this.gameStore.currentGame();
    if (!game) return;

    this.submitting.set(true);
    try {
      const updated = await this.ratingsService.upsertRating(game.$id, {
        rating: this.editRating(),
        title: this.editTitle(),
        content: this.editContent(),
      });

      // Se o usuário escreveu uma review qualificada pela primeira vez, atualizar o saldo local de moedas visualmente
      const wasNew = !this.myRating();
      if (wasNew) {
        const isLong = this.editContent().trim().length > 100;
        const rewardAmount = isLong ? 5 : 1; // 5 Z-Coins para review estruturada, 1 para rápida
        this.authStore.adjustZcoinBalance(rewardAmount);
      }

      this.myRating.set(updated);
      this.showForm.set(false);
      this.clearEditFields();
      
      // Recarregar feed para sincronizar
      this.ratings.set([]);
      this.page.set(1);
      await this.loadPage();
      await this.loadMyRating();
      await this.gameController.refreshGameRating();
    } catch (err) {
      console.error('Erro ao salvar crítica:', err);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteReview() {
    const game = this.gameStore.currentGame();
    if (!game) return;

    if (!confirm('Deseja realmente excluir sua crítica?')) return;

    this.submitting.set(true);
    try {
      await this.ratingsService.deleteRating(game.$id);
      this.myRating.set(null);
      this.showForm.set(false);
      this.clearEditFields();

      // Recarregar feed
      this.ratings.set([]);
      this.page.set(1);
      await this.loadPage();
      await this.gameController.refreshGameRating();
    } catch (err) {
      console.error('Erro ao excluir crítica:', err);
    } finally {
      this.submitting.set(false);
    }
  }

  loadMore() {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      void this.loadPage();
    }
  }

  hasMore() {
    return this.page() < this.totalPages();
  }

  getStarsArray(rating: number): number[] {
    const count = Math.floor(rating);
    return Array(count).fill(0);
  }

  getAvatar(profile: any) {
    if (profile?.avatarUrl) return profile.avatarUrl;

    return appwrite.avatars.getInitials({
      name: profile?.gamertag || 'Jogador',
      width: 64,
      height: 64,
      background: '3e63dd',
    });
  }

  trackByReviewId(index: number, item: RatingRow) {
    return item.$id;
  }

  async voteReview(review: RatingRow, operation: 'up' | 'down') {
    if (!this.authStore.isAuthenticated()) {
      alert('Você precisa estar logado para votar.');
      return;
    }

    try {
      const res = await this.ratingsService.voteRating(review.$id, operation);
      
      if (this.myRating() && this.myRating()?.$id === review.$id) {
        this.myRating.update(r => r ? { ...r, voteCount: res.newVoteCount } : null);
      } else {
        this.ratings.update(list => list.map(r => r.$id === review.$id ? { ...r, voteCount: res.newVoteCount } : r));
      }
    } catch (err) {
      console.error('Failed to vote', err);
    }
  }
}
