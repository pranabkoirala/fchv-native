import { unSyncedTodos } from "@/hooks/database/models/TodoModel";
import { postBulkTodos } from "../todo/mutation";
import { fetchTodosFromServer } from "../todo/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedTodosToServer() {
  await sendUnsyncedToServer(unSyncedTodos, postBulkTodos, "todo");
}

export async function getUnsyncedTodosFromServer(
  last_synced_at: string | null,
) {
  await fetchTodosFromServer({
    sync_timestamp: last_synced_at,
  });
}
