import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type ZereiList = {
    ownerFingerprint: string,
    title: string,
    slug: string,
    description?: string,
    isPublic?: boolean
}
type ZereiListRow = StoredRow<ZereiList>
type ZereiLists = StoredList<ZereiListRow>

type ZereiItemList = {
    list: string,
    game: string,
    postion: number
}
type ZereiItemListRow = StoredRow<ZereiItemList>
type ZereiItemLists = StoredList<ZereiItemListRow>

export type { ZereiList, ZereiListRow, ZereiLists, ZereiItemList, ZereiItemListRow, ZereiItemLists }