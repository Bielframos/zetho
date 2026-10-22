export type ForumSort = 'recent' | 'top';

export interface ForumAuthorSummary {
  $id: string;
  gamertag: string;
  avatarUrl: string | null;
}

export interface ForumGameSummary {
  $id: string;
  name: string;
  slug: string;
  coverUrl: string | null;
  releaseYear: string | null;
}

export interface ForumPostSeoMetadata {
  indexable: boolean;
  canonicalSlug: string;
  description: string;
}

export interface ForumPostItem {
  $id: string;
  $createdAt: string;
  $updatedAt?: string;
  gameId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  parentId: string | null;
  depth: number;
  voteCount: number;
  replyCount: number;
  viewerVote: 'up' | 'down' | null;
  author: ForumAuthorSummary | null;
  game: ForumGameSummary | null;
  seo?: ForumPostSeoMetadata;
}

export type ForumReplyItem = ForumPostItem;

export interface ForumPostsPageResponse {
  items: ForumPostItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore?: boolean;
  game?: ForumGameSummary | null;
  selectedGame?: ForumGameSummary | null;
}

export interface ForumRepliesPageResponse {
  items: ForumReplyItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasMore: boolean;
}

export interface ForumFocusedThread {
  targetId?: string;
  targetCommentId?: string;
  ancestorIds: string[];
  repliesByParent?: Record<string, ForumReplyItem[]>;
  repliesByParentId?: Record<string, ForumRepliesPageResponse>;
}

export interface ForumPostDetailResponse {
  post: ForumPostItem;
  replies: ForumRepliesPageResponse;
  focusedThread: ForumFocusedThread | null;
  seo?: ForumPostSeoMetadata;
}
