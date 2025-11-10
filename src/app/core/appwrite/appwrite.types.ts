import { Models } from "appwrite";

type StoredRow<T = any> = T & Models.Row
type StoredList<T extends Models.Row> = Models.RowList<T>

export type { StoredRow, StoredList }