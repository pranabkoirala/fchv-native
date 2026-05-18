import { getDb } from "../db";

const generateId = () => 
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export interface TodoItem {
  id: string;
  task: string;
  description?: string;
  task_date?: string;
  task_time?: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

export async function createTodo(
  task: string,
  description?: string,
  task_date?: string,
  task_time?: string
): Promise<TodoItem> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO todo (id, task, description, task_date, task_time, is_completed, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, task, description || null, task_date || null, task_time || null, now, now]
  );

  return { id, task, description, task_date, task_time, is_completed: 0, created_at: now, updated_at: now };
}

export async function getAllTodos(): Promise<TodoItem[]> {
  const db = await getDb();
  return await db.getAllAsync<TodoItem>(
    `SELECT * FROM todo WHERE is_deleted = 0 ORDER BY created_at DESC`
  );
}

export async function updateTodo(id: string, updates: Partial<TodoItem>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    sets.push(`${key} = ?`);
    params.push(value);
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`);
  params.push(now);
  params.push(id);
  
  await db.runAsync(
    `UPDATE todo SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE todo SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id]
  );
}
