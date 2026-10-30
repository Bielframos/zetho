import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { ContentIntentService } from './content-intent.service';

@Injectable({ providedIn: 'root' })
export class AcquisitionAnalytics {
  private analytics = inject(Analytics, { optional: true });
  private intent = inject(ContentIntentService);

  emit(
    event:
      | 'content_cta_click'
      | 'content_action_complete'
      | 'first_game_saved'
      | 'sign_up',
    extra: {
      method?: 'password';
      invite_status?: 'accepted' | 'none' | 'unknown';
      game_id?: string;
    } = {},
  ) {
    const context = this.intent.read();
    try {
      if (!this.analytics) return;
      const params = {
        ...(extra.method ? { method: extra.method } : {}),
        ...(extra.invite_status ? { invite_status: extra.invite_status } : {}),
        source_type: context?.source ?? 'direct',
        ...(context
          ? {
              content_id: context.contentId,
              game_id: extra.game_id ?? context.gameId,
              cta_action: context.action,
              cta_position: context.position,
            }
          : {}),
        ...(!context && extra.game_id ? { game_id: extra.game_id } : {}),
        // Never allow the SDK to attach invitation/reset query parameters.
        page_location:
          typeof location === 'undefined'
            ? undefined
            : `${location.origin}${location.pathname}`,
        page_referrer: '',
      };
      if (event === 'sign_up')
        logEvent(this.analytics, 'sign_up', { ...params, method: 'password' });
      else logEvent(this.analytics, event, params);
    } catch {
      /* Analytics must never prevent a successful product action. */
    }
  }
}
