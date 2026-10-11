import { profileForeground, profileReadableBackground } from '../../shared/ui/profile-theme-contrast';
export type ShareFormat = 'story' | 'square';

export interface ShareGame {
  name: string;
  coverUrl: string | null;
  releaseYear?: string | null;
}

export interface ShareAuthor {
  gamertag: string;
  avatarUrl?: string | null;
}

export interface ShareZereiData {
  kind: 'zerei';
  game: ShareGame;
  author: ShareAuthor;
  completedCount?: number | null;
  /** Nota que o autor deu ao jogo (opcional). Exibida se o usuário optar. */
  rating?: number | null;
}

export interface ShareReviewData {
  kind: 'review';
  game: ShareGame;
  author: ShareAuthor;
  rating: number;
  content?: string | null;
}

export interface ShareLibraryData {
  kind: 'library';
  author: ShareAuthor;
  covers: string[];
  counts: {
    completed: number;
    playing: number;
    dropped: number;
    wishlist: number;
  };
}

export interface ShareListData {
  kind: 'list';
  author: ShareAuthor;
  title: string;
  /** Capas dos itens, já na ordem da lista. O modal fatia pelos N primeiros. */
  covers: string[];
  itemCount: number;
}

export type ShareCardData =
  | ShareZereiData
  | ShareReviewData
  | ShareLibraryData
  | ShareListData;

/** Quantidades oferecidas ao compartilhar uma lista (N primeiros itens). */
export const SHARE_LIST_COUNTS = [3, 5, 10] as const;

export const SHARE_DIMENSIONS: Record<
  ShareFormat,
  { width: number; height: number }
> = {
  story: { width: 540, height: 960 },
  square: { width: 540, height: 540 },
};

/**
 * Fundo do card de compartilhamento. `css` é aplicado direto na propriedade
 * `background`; `accent` tinge o eyebrow/divisores. Todos escuros e fiéis à
 * paleta blue/gray da marca.
 */
export interface ShareBackground {
  foreground?: string;
  id: string;
  label: string;
  css: string;
  accent: string;
}

export const SHARE_BACKGROUNDS: ShareBackground[] = [
  {
    id: 'graphite',
    label: 'Grafite',
    css: '#101113',
    accent: '#3e63dd',
  },
  {
    id: 'midnight',
    label: 'Meia-noite',
    css: 'linear-gradient(165deg, #101113 0%, #16215c 100%)',
    accent: '#5b7cfa',
  },
  {
    id: 'eclipse',
    label: 'Eclipse',
    css: 'radial-gradient(130% 80% at 50% 0%, #2a3f8f 0%, #101113 58%)',
    accent: '#93b4ff',
  },
];

/**
 * Constrói um fundo a partir do tema ativo do perfil (loja de temas). Retorna
 * `null` quando não há tema — nesse caso a opção "Meu tema" fica oculta.
 */
export function themeToBackground(
  theme: { backgroundColor?: string; primaryColor?: string } | null | undefined,
): ShareBackground | null {
  if (!theme) return null;
  const bg = profileReadableBackground(theme.backgroundColor || '#101113');
  return {
    id: 'theme',
    label: 'Meu tema',
    css: bg,
    foreground: profileForeground(bg),
    accent: profileForeground(bg),
  };
}
