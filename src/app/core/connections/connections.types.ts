import { StoredList, StoredRow } from '../../shared/infra/appwrite/appwrite.types';

type Connection = {
  requesterProfileId: string;
  targetProfileId: string;
};

type ConnectionRow = StoredRow<Connection>;
type CConnectionList = StoredList<ConnectionRow>;

export type { Connection, ConnectionRow, CConnectionList };
