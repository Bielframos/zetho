import { StoredList, StoredRow } from '../../shared/infra/appwrite/appwrite.types';
import { UserProfileRow } from '../../types';

type Comment = {
  gameId: string;
  userProfile: UserProfileRow;
  title?: string | null;
  slug?: string | null;
  content: string;
  parentId?: string;
  votes?: {
    $id: string;
    type: 'up' | 'down';
    comment: CommentRow;
    userId: string;
  }[];
  voteCount?: number;
  replyCount?: number;
  depth?: number;
  viewerVote?: 'up' | 'down' | null;
};

type CommentRow = StoredRow<Comment>;
type CommentList = StoredList<CommentRow>;

export type { Comment, CommentList, CommentRow };
