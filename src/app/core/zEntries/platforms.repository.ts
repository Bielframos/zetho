import { Injectable } from '@angular/core';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';
import { UiSelectOption } from '../../shared/ui/select';

export function platformLogo(
  name: string,
  manufacturer = '',
): string | undefined {
  const text = `${name} ${manufacturer}`.toLowerCase();
  const brand = /playstation|\bps[1-5]\b/.test(text)
    ? 'playstation'
    : /xbox/.test(text)
      ? 'xbox'
      : /nintendo/.test(text)
        ? 'nintendo'
        : /steam|\bpc\b|windows/.test(text)
          ? 'steam'
          : undefined;
  return brand ? `/icons/platforms/${brand}.svg` : undefined;
}

@Injectable({ providedIn: 'root' })
export class PlatformsRepository {
  private cached?: Promise<UiSelectOption[]>;
  list(): Promise<UiSelectOption[]> {
    return (this.cached ??= this.load().catch((error) => {
      this.cached = undefined;
      throw error;
    }));
  }
  private async load(): Promise<UiSelectOption[]> {
    const options: UiSelectOption[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = await appwrite.databases.listRows({
        databaseId: 'app',
        tableId: 'game_platforms',
        queries: [
          Query.orderAsc('$id'),
          Query.limit(100),
          ...(cursor ? [Query.cursorAfter(cursor)] : []),
        ],
      });
      for (const row of page.rows) {
        const name = String(row['name']);
        options.push({
          value: row.$id,
          label: name,
          logo: platformLogo(name, row['manufacturer']),
          searchText: `${row['shortName'] ?? ''} ${row['slug'] ?? ''}`,
        });
      }
      if (page.rows.length < 100) break;
      cursor = page.rows.at(-1)!.$id;
    }
    return options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }
}
