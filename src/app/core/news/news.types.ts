export interface NewsAuthor {
  name: string;
  slug?: string | null;
  /**
   * Autoria automatizada (assistente editorial de IA). Usado para exibir a
   * divulgação junto ao byline e para montar o JSON-LD coerente com ela.
   */
  isAutomated?: boolean;
}

export interface NewsSummary {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  subtitle: string | null;
  slug: string;
  tags: string[];
  author: NewsAuthor | null;
}

export interface NewsDetail extends NewsSummary {
  body: string;
  originalSourceUrl: string | null;
  relatedGames: Array<{
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
  }>;
}

export interface NewsListResponse {
  items: NewsSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
