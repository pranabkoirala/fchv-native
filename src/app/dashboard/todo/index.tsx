import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import { Skeleton } from "@/components/common/Skeleton";
import TaskModal, { TaskModalData } from "@/components/common/TaskModal";
import CustomHeader from "@/components/CustomHeader";
import { useFocusEffect, useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  ClipboardList,
  Clock,
  Edit2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { useLanguage } from "../../../context/LanguageContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  TodoItem,
  updateTodo,
} from "../../../hooks/database/models/TodoModel";
import {
  cancelTaskNotificationAsync,
  getScheduledTaskNotificationIdsAsync,
  scheduleTaskNotificationAsync,
  shouldRepairMissingTaskNotification,
} from "../../../utils/notificationHelper";

const TodoSkeleton = () => (
  <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 flex-row items-center">
    <View className="mr-3 mt-0.5">
      <Skeleton width={24} height={24} borderRadius={6} />
    </View>
    <View className="flex-1 gap-2">
      <Skeleton width="60%" height={20} borderRadius={6} />
      <Skeleton width="80%" height={14} borderRadius={4} />
      <View className="flex-row items-center mt-1 gap-4">
        <Skeleton width={60} height={12} borderRadius={4} />
        <Skeleton width={80} height={12} borderRadius={4} />
      </View>
    </View>
    <View className="flex-row items-center ml-2 gap-x-2">
      <Skeleton width={36} height={36} borderRadius={12} />
    </View>
  </View>
);

type Priority = "URGENT" | "MEDIUM" | "NORMAL";

interface RichTaskData {
  title: string;
  patient?: string;
  time?: string;
  location?: string;
  priority: Priority;
}

// Helper to parse the DB string which could be plain text or JSON
function parseTaskString(raw: string): RichTaskData {
  try {
    const data = JSON.parse(raw);
    if (data && data.title) {
      return data as RichTaskData;
    }
  } catch (e) {
    // ignore
  }
  return {
    title: raw,
    priority: "NORMAL",
  };
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function TasksScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  // Delete Confirmation State
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadTodos = useCallback(async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data = await getAllTodos();
      setTodos(data);
      await scheduleMissingTaskNotifications(data);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos(true);
  }, [loadTodos]);

  useFocusEffect(
    useCallback(() => {
      loadTodos(true);
    }, [loadTodos]),
  );

  const { refreshing, onRefresh } = usePullToRefresh(
    useCallback(() => loadTodos(false), [loadTodos])
  );

  const scheduleMissingTaskNotifications = async (items: TodoItem[]) => {
    const nextTodos = [...items];
    let didUpdate = false;
    const scheduledNotificationIds =
      await getScheduledTaskNotificationIdsAsync();

    for (const todo of items) {
      if (todo.is_completed === 1 || !todo.task_date) {
        continue;
      }

      if (
        todo.notification_id &&
        scheduledNotificationIds.has(todo.notification_id)
      ) {
        continue;
      }

      const parsed = parseTaskString(todo.task);
      const taskTime = todo.task_time || parsed.time;

      if (
        todo.notification_id &&
        !shouldRepairMissingTaskNotification(
          todo.task_date,
          taskTime,
          todo.updated_at,
        )
      ) {
        continue;
      }

      const notificationId = await scheduleTaskNotificationAsync({
        id: todo.id,
        title: parsed.title,
        taskDate: todo.task_date,
        taskTime,
      });

      if (!notificationId) {
        continue;
      }

      await updateTodo(todo.id, { notification_id: notificationId });
      const index = nextTodos.findIndex((item) => item.id === todo.id);
      if (index >= 0) {
        nextTodos[index] = {
          ...nextTodos[index],
          notification_id: notificationId,
        };
        didUpdate = true;
      }
    }

    if (didUpdate) {
      setTodos(nextTodos);
    }
  };

  const handleToggleTodo = async (id: string, isCompleted: number) => {
    try {
      const newStatus = isCompleted === 1 ? 0 : 1;
      const todo = todos.find((item) => item.id === id);
      const parsed = todo ? parseTaskString(todo.task) : null;
      let notificationId: string | null = todo?.notification_id || null;

      if (newStatus === 1) {
        await cancelTaskNotificationAsync(notificationId);
        notificationId = null;
      } else if (todo && parsed) {
        notificationId = await scheduleTaskNotificationAsync({
          id: todo.id,
          title: parsed.title,
          taskDate: todo.task_date,
          taskTime: todo.task_time || parsed.time,
        });
      }

      await updateTodo(id, {
        is_completed: newStatus,
        notification_id: notificationId,
      });
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                is_completed: newStatus,
                notification_id: notificationId,
              }
            : todo,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDeleteTodo = (id: string) => {
    setTodoToDelete(id);
    setIsDeleteConfirmVisible(true);
  };

  const executeDeleteTodo = async () => {
    if (!todoToDelete) return;
    try {
      setIsDeleting(true);
      const todo = todos.find((item) => item.id === todoToDelete);
      await cancelTaskNotificationAsync(todo?.notification_id);
      await deleteTodo(todoToDelete);
      setTodos((prev) => prev.filter((todo) => todo.id !== todoToDelete));
      setIsDeleteConfirmVisible(false);
      setTodoToDelete(null);
    } catch (error) {
      console.error("Failed to delete todo:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPress = (todo: TodoItem) => {
    setEditingTodo(todo);
    setTaskModalVisible(true);
  };

  const handleTaskModalSubmit = async (data: TaskModalData) => {
    setIsTaskSubmitting(true);
    try {
      if (editingTodo) {
        const existingTodo = editingTodo;
        await cancelTaskNotificationAsync(existingTodo.notification_id);
        const notificationId =
          existingTodo.is_completed === 1
            ? null
            : await scheduleTaskNotificationAsync({
                id: existingTodo.id,
                title: data.title,
                taskDate: data.task_date,
                taskTime: data.task_time,
              });

        await updateTodo(existingTodo.id, {
          task: JSON.stringify({
            title: data.title,
            patient: data.patient || undefined,
            time: data.task_time,
            location: data.location,
            priority: data.priority,
          }),
          description: data.description || null,
          task_date: data.task_date,
          task_time: data.task_time,
          notification_id: notificationId,
        });

        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === existingTodo.id
              ? {
                  ...todo,
                  task: JSON.stringify({
                    title: data.title,
                    patient: data.patient || undefined,
                    time: data.task_time,
                    location: data.location,
                    priority: data.priority,
                  }),
                  description: data.description || null,
                  task_date: data.task_date,
                  task_time: data.task_time,
                  notification_id: notificationId,
                  updated_at: new Date().toISOString(),
                }
              : todo,
          ),
        );
      } else {
        const newItem = await createTodo(
          JSON.stringify({
            title: data.title,
            patient: data.patient || undefined,
            time: data.task_time,
            location: data.location,
            priority: data.priority,
          }),
          data.description || null,
          data.task_date,
          data.task_time,
        );

        const notificationId = await scheduleTaskNotificationAsync({
          id: newItem.id,
          title: data.title,
          taskDate: newItem.task_date,
          taskTime: newItem.task_time,
        });

        if (notificationId) {
          await updateTodo(newItem.id, { notification_id: notificationId });
        }

        setTodos((prev) => [
          { ...newItem, notification_id: notificationId },
          ...prev,
        ]);
      }

      setTaskModalVisible(false);
      setEditingTodo(null);
    } catch (error) {
      console.error("Failed to save todo task:", error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    let pending = 0;
    let done = 0;
    let urgent = 0;

    todos.forEach((t) => {
      if (t.is_completed === 1) {
        done++;
      } else {
        pending++;
        const parsed = parseTaskString(t.task);
        if (parsed.priority === "URGENT") {
          urgent++;
        }
      }
    });

    return { pending, done, urgent };
  }, [todos]);

  const renderTitleSection = () => (
    <View className="pb-4">
      <CustomHeader
        title={t("todo_tasks.title")}
        onBackPress={() => router.back()}
      />

      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        className="flex-row mt-2"
      >
        <View className="bg-emerald-100 px-3 ml-6 py-1.5 rounded-full flex-row items-center">
          <ClipboardList size={14} color="#059669" strokeWidth={2.5} />
          <Text className="text-emerald-700 text-[12px] font-bold ml-1.5">
            {t("todo_tasks.pending_tasks_today", { count: stats.pending })}
          </Text>
        </View>
      </Animated.View>
    </View>
  );

  const renderSummaryCards = () => (
    <View className="px-6 flex-row justify-between mb-6 gap-3">
      {/* Pending */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="flex-1 bg-[#E8F3FF] rounded-2xl p-4 items-center"
      >
        <ClipboardList size={26} color="#475569" strokeWidth={2} />
        <View className="mt-2 h-[32px] justify-center">
          {loading ? (
            <Skeleton width={30} height={24} borderRadius={6} />
          ) : (
            <Text className="text-[22px] font-bold text-slate-700">
              {String(stats.pending).padStart(2, "0")}
            </Text>
          )}
        </View>
        <Text className="text-[13px] font-medium text-slate-500 mt-0.5">
          {t("todo_tasks.pending")}
        </Text>
      </Animated.View>

      {/* Done */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        className="flex-1 bg-[#D1FAE5] rounded-2xl p-4 items-center"
      >
        <CheckCircle size={26} color="#059669" strokeWidth={2} />
        <View className="mt-2 h-[32px] justify-center">
          {loading ? (
            <Skeleton width={30} height={24} borderRadius={6} />
          ) : (
            <Text className="text-[22px] font-black text-emerald-700">
              {String(stats.done).padStart(2, "0")}
            </Text>
          )}
        </View>
        <Text className="text-[13px] font-medium text-emerald-600 mt-0.5">
          {t("todo_tasks.done")}
        </Text>
      </Animated.View>

      {/* Urgent */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        className="flex-1 bg-[#FFE4E6] rounded-2xl p-4 items-center"
      >
        <AlertCircle size={26} color="#E11D48" strokeWidth={2} />
        <View className="mt-2 h-[32px] justify-center">
          {loading ? (
            <Skeleton width={30} height={24} borderRadius={6} />
          ) : (
            <Text className="text-[22px] font-black text-rose-700">
              {String(stats.urgent).padStart(2, "0")}
            </Text>
          )}
        </View>
        <Text className="text-[13px] font-medium text-rose-600 mt-0.5">
          {t("todo_tasks.urgent")}
        </Text>
      </Animated.View>
    </View>
  );

  const renderTaskCard = (todo: TodoItem, index: number) => {
    const isDone = todo.is_completed === 1;
    const parsed = parseTaskString(todo.task);

    // Priority Badge Styles
    const pStyles: Record<string, { bg: string; text: string }> = {
      URGENT: { bg: "bg-rose-100", text: "text-rose-700" },
      MEDIUM: { bg: "bg-amber-100", text: "text-amber-700" },
      NORMAL: { bg: "bg-emerald-100", text: "text-emerald-700" },
    };
    const pStyle = pStyles[parsed.priority] || pStyles.NORMAL;

    return (
      <Animated.View
        key={todo.id}
        entering={FadeInDown.delay(100 + index * 50).duration(400)}
        layout={Layout.springify()}
        className={`bg-white rounded-xl p-4 mb-4 border border-slate-200 flex-row ${
          isDone ? "opacity-60" : ""
        }`}
      >
        {/* Checkbox */}
        <TouchableOpacity
          className="mr-3 mt-0.5"
          onPress={() => handleToggleTodo(todo.id, todo.is_completed)}
        >
          {isDone ? (
            <View className="w-6 h-6 rounded-md bg-emerald-500 items-center justify-center">
              <CheckSquare size={16} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : (
            <View className="w-6 h-6 rounded-md border-2 border-slate-300 bg-slate-50 items-center justify-center" />
          )}
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={0.7}
          onPress={() => handleToggleTodo(todo.id, todo.is_completed)}
        >
          <View className="flex-row justify-between items-start">
            <Text
              className={`text-[16px] font-bold flex-1 mr-2 ${
                isDone ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {parsed.title}
            </Text>

            {/* Edit Button */}
            <View className="flex-row items-center ml-2 gap-x-2">
              <TouchableOpacity
                className="p-2 bg-slate-50 rounded-xl border border-slate-100"
                onPress={() => handleEditPress(todo)}
              >
                <Edit2 size={16} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>

              {isDone && (
                <TouchableOpacity
                  className="p-2.5 bg-rose-50 rounded-xl border border-rose-100"
                  onPress={() => handleDeleteTodo(todo.id)}
                >
                  <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {todo.description ? (
            <Text className="text-[13px] text-slate-500 font-medium mt-1 mb-1">
              {todo.description}
            </Text>
          ) : null}

          {parsed.patient && (
            <Text className="text-[13px] text-slate-500 font-medium mt-1">
              {t("todo_tasks.patient", { name: parsed.patient })}
            </Text>
          )}

          {/* Metadata Row */}
          <View className="flex-row items-center mt-2.5">
            {todo.task_date && (
              <View className="flex-row items-center mr-4">
                <Text className="text-[12px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                  {todo.task_date}
                </Text>
              </View>
            )}
            <View className="flex-row items-center mr-4">
              <Clock size={14} color="#64748B" />
              <Text className="text-[12px] text-slate-600 font-medium ml-1.5">
                {todo.task_time || parsed.time || t("todo_tasks.anytime")}
              </Text>
            </View>

            <View className="flex-row items-center">
              {isDone ? (
                <>
                  <CheckCircle size={14} color="#64748B" />
                  <Text className="text-[12px] text-slate-600 font-medium ml-1.5">
                    {t("todo_tasks.completed")}
                  </Text>
                </>
              ) : (
                <>
                  <MapPin size={14} color="#64748B" />
                  <Text
                    className="text-[12px] text-slate-600 font-medium ml-1.5"
                    numberOfLines={1}
                  >
                    {parsed.location || t("todo_tasks.general")}
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyList = () => (
    <View className="px-6">
      {loading ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <TodoSkeleton key={i} />
          ))}
        </View>
      ) : (
        <View className="py-10 items-center justify-center bg-white rounded-3xl border border-slate-100">
          <CheckSquare size={40} color="#E2E8F0" />
          <Text className="text-slate-400 font-bold mt-3">
            {t("todo_tasks.no_tasks")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white pt-8">
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={loading ? [] : todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View className="px-6">{renderTaskCard(item, index)}</View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {renderTitleSection()}
            {renderSummaryCards()}
          </>
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        entering={FadeInDown.delay(500).springify()}
        activeOpacity={0.8}
        onPress={() => {
          setEditingTodo(null);
          setTaskModalVisible(true);
        }}
        className="absolute bottom-44 right-6 w-[60px] h-[60px] rounded-full bg-[#356169] items-center justify-center"
      >
        <Plus size={30} color="#FFFFFF" />
      </AnimatedTouchableOpacity>

      <TaskModal
        visible={isTaskModalVisible}
        onClose={() => {
          setTaskModalVisible(false);
          setEditingTodo(null);
        }}
        onSubmit={handleTaskModalSubmit}
        initialData={
          editingTodo
            ? {
                title: parseTaskString(editingTodo.task).title || "",
                description: editingTodo.description || null,
                task_date: editingTodo.task_date || "",
                task_time:
                  editingTodo.task_time ||
                  parseTaskString(editingTodo.task).time ||
                  "",
                patient: parseTaskString(editingTodo.task).patient || null,
                location: parseTaskString(editingTodo.task).location || "",
                priority:
                  parseTaskString(editingTodo.task).priority || "NORMAL",
              }
            : undefined
        }
        submitLabel={
          editingTodo
            ? t("todo_tasks.save_changes")
            : t("todo_tasks.create_task")
        }
        headerTitle={
          editingTodo ? t("todo_tasks.edit_task") : t("todo_tasks.add_task")
        }
        submitting={isTaskSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal
        visible={isDeleteConfirmVisible}
        onClose={() => {
          setIsDeleteConfirmVisible(false);
          setTodoToDelete(null);
        }}
        title={t("reports.common.delete_confirm_title")}
        description={t("reports.common.delete_confirm_msg")}
        actionLabel={t("common.delete")}
        onAction={executeDeleteTodo}
        loading={isDeleting}
      />
    </View>
  );
}
