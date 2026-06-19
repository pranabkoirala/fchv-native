import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { TodoItem } from "@/hooks/database/models/TodoModel";

const mapTodoToSyncPayload = (data: TodoItem) => ({
  id: data.id,
  task: data.task,
  description: data.description ?? null,
  task_date: data.task_date ?? null,
  task_time: data.task_time ?? null,
  notification_id: data.notification_id ?? null,
  is_completed: data.is_completed === 1,
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postTodo = async (data: TodoItem) => {
  const response = await httpClient.post<TodoItem | TodoItem[]>(
    API_LIST.todo.post,
    [mapTodoToSyncPayload(data)],
  );

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkTodos = async (data: TodoItem[]) => {
  const response = await httpClient.post<TodoItem[]>(
    API_LIST.todo.post,
    data.map(mapTodoToSyncPayload),
  );

  return response.data;
};

export { postBulkTodos, postTodo };
