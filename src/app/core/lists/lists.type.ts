import { StoredList, StoredRow } from '../../shared/infra/appwrite/appwrite.types';

type ZereiList = {
  ownerFingerprint: string;
  title: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
  itemCount?: number;
  likeCount?: number;
  saveCount?: number;
  coverImageUrls?: string[];
  latestAdditions?: string[];
  lastOrderKey?: string;
};
type ZereiListRow = StoredRow<ZereiList>;
type ZereiLists = StoredList<ZereiListRow>;

type ZereiListItem = {
  list: string;
  game: string;
  orderKey: string;
};
type ZereiListItemRow = StoredRow<ZereiListItem>;
type ZereiListItems = StoredList<ZereiListItemRow>;

export type {
  ZereiList,
  ZereiListRow,
  ZereiLists,
  ZereiListItem,
  ZereiListItemRow,
  ZereiListItems,
};
