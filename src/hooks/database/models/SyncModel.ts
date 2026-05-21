import { getDb } from "../db";
import { SyncRow } from "../types/sync";
import { TableType } from "../types/table";

export async function ensureSyncRow(tableName: TableType): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
    [tableName],
  );
}

export async function getSyncTimestamp(
  tableName: TableType,
): Promise<string | null> {
  const db = await getDb();
  await ensureSyncRow(tableName);

  const row = await db.getFirstAsync<Pick<SyncRow, "last_synced_at">>(
    `SELECT last_synced_at FROM sync WHERE table_name = ?;`,
    [tableName],
  );

  return row?.last_synced_at ?? null;
}

export async function setSyncTimestamp(
  tableName: TableType,
  timestamp: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync (table_name, last_synced_at) VALUES (?, ?);`,
    [tableName, timestamp],
  );
}

export async function getTablesWithTimestamp(): Promise<
  Record<TableType, string | null>
> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    table_name: TableType;
    last_synced_at: string | null;
  }>("SELECT table_name, last_synced_at FROM sync");

  const result: Partial<Record<TableType, string | null>> = {};

  for (const r of rows) {
    result[r.table_name] = r.last_synced_at || null;
  }

  return result as Record<TableType, string>;
}
