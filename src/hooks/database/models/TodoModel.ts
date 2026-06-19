import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface TodoItem {
  id: string;
  task: string;
  description?: string | null;
  task_date?: string | null;
  task_time?: string | null;
  notification_id?: string | null;
  is_completed: number;
  is_synced: number;
  is_deleted: number;
  reg_year?: number | null;
  reg_month?: number | string | null;
  created_at: string;
  updated_at: string;
}

const TODO_UPDATE_COLUMNS = new Set<keyof TodoItem>([
  "task",
  "description",
  "task_date",
  "task_time",
  "notification_id",
  "is_completed",
  "is_synced",
  "is_deleted",
  "reg_year",
  "reg_month",
]);

export async function createTodo(
  task: string,
  description?: string | null,
  task_date?: string | null,
  task_time?: string | null,
): Promise<TodoItem> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  await db.runAsync(
    `INSERT INTO todo
      (id, task, description, task_date, task_time, is_completed, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
    [
      id,
      task,
      description || null,
      task_date || null,
      task_time || null,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    id,
    task,
    description: description || null,
    task_date: task_date || null,
    task_time: task_time || null,
    notification_id: null,
    is_completed: 0,
    is_synced: 0,
    is_deleted: 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    created_at: now,
    updated_at: now,
  };
}

export async function getAllTodos(): Promise<TodoItem[]> {
  const db = await getDb();
  return await db.getAllAsync<TodoItem>(
    `SELECT * FROM todo WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
}

export async function updateTodo(
  id: string,
  updates: Partial<TodoItem>,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const sets: string[] = [];
  const params: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (!TODO_UPDATE_COLUMNS.has(key as keyof TodoItem)) return;
    sets.push(`${key} = ?`);
    params.push(value === undefined ? null : value);
  });

  if (sets.length === 0) return;

  if (updates.is_synced === undefined) {
    sets.push(`is_synced = ?`);
    params.push(0);
  }

  sets.push(`updated_at = ?`);
  params.push(now);
  params.push(id);

  await db.runAsync(`UPDATE todo SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE todo SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export async function unSyncedTodos(): Promise<TodoItem[]> {
  const db = await getDb();
  return await db.getAllAsync<TodoItem>(`SELECT * FROM todo WHERE is_synced = 0`);
}

export async function insertToTempTodoTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  const columns = [
    "id",
    "task",
    "description",
    "task_date",
    "task_time",
    "notification_id",
    "is_completed",
    "is_synced",
    "is_deleted",
    "reg_year",
    "reg_month",
    "created_at",
    "updated_at",
  ];

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "todo_staging",
      columns,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = item.deleted ?? item.is_deleted ?? false;

        return [
          item.id,
          item.task,
          item.description ?? null,
          item.task_date ?? null,
          item.task_time ?? null,
          item.notification_id ?? null,
          item.is_completed ? 1 : 0,
          1,
          deleted ? 1 : 0,
          item.reg_year ?? null,
          item.reg_month ?? null,
          createdAt,
          updatedAt,
        ];
      },
    },
    apiRes,
  );
}

export async function moveTempToRealTodoTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<TodoItem>(`SELECT * FROM todo_staging`);
  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO todo
        (id, task, description, task_date, task_time, notification_id, is_completed, is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        task = excluded.task,
        description = excluded.description,
        task_date = excluded.task_date,
        task_time = excluded.task_time,
        notification_id = excluded.notification_id,
        is_completed = excluded.is_completed,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted,
        reg_year = excluded.reg_year,
        reg_month = excluded.reg_month,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      WHERE datetime(excluded.updated_at) > datetime(todo.updated_at)
         OR todo.updated_at IS NULL;
      `,
      [
        item.id,
        item.task,
        item.description ?? null,
        item.task_date ?? null,
        item.task_time ?? null,
        item.notification_id ?? null,
        item.is_completed ? 1 : 0,
        1,
        item.is_deleted ? 1 : 0,
        item.reg_year ?? null,
        item.reg_month ?? null,
        item.created_at,
        item.updated_at,
      ],
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("todo", now);
}
