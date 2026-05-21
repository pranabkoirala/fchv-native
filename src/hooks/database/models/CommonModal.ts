import { toSqlParam } from "@/utils/parse";
import { SQLiteDatabase } from "expo-sqlite";
import { getDb } from "../db";
import { TableType } from "../types/table";

export async function deleteRecords(
  tableName: TableType,
  ids: string[],
  deleteType: "hard" | "soft",
): Promise<void> {
  if (ids.length === 0) return;

  const db = await getDb();

  if (deleteType === "hard") {
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `DELETE FROM ${tableName} WHERE id IN (${placeholders})`,
      ids,
    );
  } else {
    const placeholders = ids.map(() => "?").join(",");
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE ${tableName}
   SET is_synced = ?, is_deleted = ?, updated_at = ?
   WHERE id IN (${placeholders})`,
      [0, 1, now, ...ids],
    );
  }
}

export async function clearTable(tableName: TableType) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${tableName};`);
}

export async function bulkInsertToTempTable<T>(
  opts: {
    db: SQLiteDatabase;
    table: string;
    columns: string[];
    rows: (item: T) => any[]; // must match columns length/order
    onConflict?: "none" | "replace" | "ignore"; // optional
  },
  items: T[],
) {
  if (!items?.length) return;

  const { db, table, columns, rows, onConflict = "none" } = opts;

  if (!columns.length) throw new Error("columns must not be empty");

  const placeholders = columns.map(() => "?").join(", ");
  const colSql = columns.join(", ");

  const insertVerb =
    onConflict === "replace"
      ? "INSERT OR REPLACE"
      : onConflict === "ignore"
        ? "INSERT OR IGNORE"
        : "INSERT";

  const sql = `${insertVerb} INTO ${table} (${colSql}) VALUES (${placeholders});`;

  for (const item of items) {
    const vals = rows(item);
    if (vals.length !== columns.length) {
      throw new Error(
        `Row values length (${vals.length}) != columns length (${columns.length}) for table ${table}`,
      );
    }
    await db.runAsync(sql, vals.map(toSqlParam));
  }
}
