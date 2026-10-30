import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { safeSessionStorage } from '../../utils/platform-storage';

export interface ContentIntent {
  source: 'news' | 'editorial_list';
  contentId: string;
  slug: string;
  gameId: string;
  action: 'wishlist';
  position: 'related_games' | 'list_item';
  requestId: string;
  createdAt: number;
  owner?: string;
}
const KEY = 'zetho:content-intent:v1';
const ID = /^[a-zA-Z0-9_-]{1,64}$/;
const SLUG = /^[a-zA-Z0-9_-]{1,255}$/;

@Injectable({ providedIn: 'root' })
export class ContentIntentService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private memory: ContentIntent | null = null;

  read(): ContentIntent | null {
    if (!this.browser) return null;
    try {
      const value =
        this.memory ?? JSON.parse(safeSessionStorage.getItem(KEY) ?? 'null');
      if (!value) return null;
      if (
        !['news', 'editorial_list'].includes(value.source) ||
        !['related_games', 'list_item'].includes(value.position) ||
        value.action !== 'wishlist' ||
        !ID.test(value.contentId) ||
        !ID.test(value.gameId) ||
        !SLUG.test(value.slug) ||
        !/^[a-zA-Z0-9-]{1,64}$/.test(value.requestId) ||
        typeof value.createdAt !== 'number' ||
        value.createdAt > Date.now() ||
        Date.now() - value.createdAt > 30 * 60 * 1000 ||
        (value.owner !== undefined && typeof value.owner !== 'string')
      ) {
        this.clear();
        return null;
      }
      return value;
    } catch {
      this.clear();
      return null;
    }
  }

  start(
    input: Pick<
      ContentIntent,
      'source' | 'contentId' | 'slug' | 'gameId' | 'position'
    >,
  ) {
    if (!this.browser) return null;
    const current = this.read();
    if (
      current &&
      current.gameId === input.gameId &&
      current.contentId === input.contentId &&
      current.source === input.source
    )
      return current;
    this.write({
      ...input,
      action: 'wishlist',
      requestId: crypto.randomUUID(),
      createdAt: Date.now(),
    });
    return this.read();
  }

  bind(owner: string) {
    const value = this.read();
    if (!value) return;
    if (value.owner && value.owner !== owner) this.clear();
    else this.write({ ...value, owner });
  }

  returnPath(owner?: string): string | null {
    const value = this.read();
    if (!value || (value.owner && value.owner !== owner)) return null;
    return `${value.source === 'news' ? '/noticias' : '/listas-editoriais'}/${value.slug}`;
  }

  clear(requestId?: string) {
    if (requestId !== undefined && this.read()?.requestId !== requestId) return;
    this.memory = null;
    safeSessionStorage.removeItem(KEY);
  }
  private write(value: ContentIntent) {
    this.memory = value;
    safeSessionStorage.setItem(KEY, JSON.stringify(value));
  }
}
