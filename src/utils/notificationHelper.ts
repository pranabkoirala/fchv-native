import { isRunningInExpoGo } from "expo";
import NepaliDate from "nepali-date-converter";
import { Platform } from "react-native";

const TODO_NOTIFICATION_CHANNEL_ID = "todo-reminders";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModulePromise: Promise<NotificationsModule | null> | null =
  null;
let notificationHandlerConfigured = false;

function canUseNotifications(): boolean {
  return Platform.OS !== "web" && !isRunningInExpoGo();
}

async function getNotificationsAsync(): Promise<NotificationsModule | null> {
  if (!canUseNotifications()) {
    console.warn(
      "Notifications are disabled in Expo Go. Use a development build or standalone app for reminders.",
    );
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications").catch((error) => {
    console.warn("Failed to load expo-notifications:", error);
    return null;
  });

  const Notifications = await notificationsModulePromise;
  if (!Notifications) return null;

  if (
    !notificationHandlerConfigured &&
    typeof Notifications.setNotificationHandler === "function"
  ) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

type TodoNotificationInput = {
  id: string;
  title: string;
  taskDate?: string | null;
  taskTime?: string | null;
};

const TODO_REMINDER_HOUR = 9;
const TODO_REMINDER_MINUTE = 0;
const IMMEDIATE_REMINDER_DELAY_SECONDS = 5;

type TaskNotificationSchedule =
  | {
      type: "date";
      date: Date;
    }
  | {
      type: "immediate";
    };

export async function configureNotificationsAsync(): Promise<void> {
  const Notifications = await getNotificationsAsync();
  if (!Notifications) return;

  if (Platform.OS === "android") {
    if (typeof Notifications.setNotificationChannelAsync !== "function") {
      console.warn(
        "Notification channel setup skipped: setNotificationChannelAsync is unavailable",
      );
      return;
    }

    await Notifications.setNotificationChannelAsync(
      TODO_NOTIFICATION_CHANNEL_ID,
      {
        name: "Task reminders",
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#475569",
        sound: "default",
      },
    );
  }
}

export async function cancelTaskNotificationAsync(
  notificationId?: string | null,
): Promise<void> {
  if (!notificationId) return;

  try {
    const Notifications = await getNotificationsAsync();
    if (!Notifications) return;
    if (typeof Notifications.cancelScheduledNotificationAsync !== "function") {
      console.warn(
        "Task notification cancel skipped: cancelScheduledNotificationAsync is unavailable",
      );
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn("Failed to cancel task notification:", error);
  }
}

export async function scheduleTaskNotificationAsync({
  id,
  title,
  taskDate,
  taskTime,
}: TodoNotificationInput): Promise<string | null> {
  const triggerDate = getTaskTriggerDate(taskDate, taskTime);
  const schedule = getTaskNotificationSchedule(triggerDate);

  if (!triggerDate) {
    console.warn("Failed to schedule task notification: invalid task date", {
      id,
      taskDate,
    });
    return null;
  }

  if (!schedule) {
    console.warn(
      "Failed to schedule task notification: trigger date has already passed",
      {
        id,
        taskDate,
        triggerDate: triggerDate.toString(),
      },
    );
    return null;
  }

  const Notifications = await getNotificationsAsync();
  if (!Notifications) {
    return null;
  }
  if (typeof Notifications.scheduleNotificationAsync !== "function") {
    console.warn(
      "Failed to schedule task notification: scheduleNotificationAsync is unavailable",
    );
    return null;
  }

  const hasPermission = await requestNotificationPermissionAsync(Notifications);
  if (!hasPermission) {
    return null;
  }

  try {
    await configureNotificationsAsync();

    const notificationId = getTaskNotificationId(id);
    await cancelTaskNotificationAsync(notificationId);

    const trigger = getExpoNotificationTrigger(Notifications, schedule);

    const scheduledNotificationId =
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "FCHV Task Reminder",
          body: `Today at ${getTaskReminderTimeLabel(triggerDate)}: ${title}`,
          sound: "default",
          data: {
            todoId: id,
            screen: "/dashboard/todo",
          },
        },
        trigger,
      });

    return scheduledNotificationId || notificationId;
  } catch (error) {
    console.error("[NOTIFY] Failed to schedule task notification:", error);
    return null;
  }
}

async function requestNotificationPermissionAsync(
  Notifications: NotificationsModule,
): Promise<boolean> {
  if (
    typeof Notifications.getPermissionsAsync !== "function" ||
    typeof Notifications.requestPermissionsAsync !== "function"
  ) {
    console.warn(
      "Notification permission request skipped: permission APIs are unavailable",
    );
    return false;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function getTaskNotificationId(todoId: string): string {
  return `todo-reminder-${todoId}`;
}

export async function getScheduledTaskNotificationIdsAsync(): Promise<
  Set<string>
> {
  try {
    const Notifications = await getNotificationsAsync();
    if (!Notifications) return new Set();
    if (typeof Notifications.getAllScheduledNotificationsAsync !== "function") {
      console.warn(
        "Scheduled notification lookup skipped: getAllScheduledNotificationsAsync is unavailable",
      );
      return new Set();
    }

    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    return new Set(
      scheduledNotifications
        .map((notification) => notification.identifier)
        .filter((identifier) => identifier.startsWith("todo-reminder-")),
    );
  } catch (error) {
    console.warn("Failed to read scheduled task notifications:", error);
    return new Set();
  }
}

export function shouldRepairMissingTaskNotification(
  taskDate?: string | null,
  taskTime?: string | null,
  updatedAt?: string | null,
): boolean {
  const triggerDate = getTaskTriggerDate(taskDate, taskTime);
  if (!triggerDate) return false;

  const now = new Date();
  if (triggerDate.getTime() > now.getTime()) {
    return true;
  }

  if (!isSameLocalDate(triggerDate, now)) {
    return false;
  }

  const updatedAtDate = updatedAt ? new Date(updatedAt) : null;
  if (!updatedAtDate || Number.isNaN(updatedAtDate.getTime())) {
    return true;
  }

  return updatedAtDate.getTime() < triggerDate.getTime();
}

function getTaskReminderTimeLabel(triggerDate: Date | null): string {
  const hour = triggerDate?.getHours() ?? TODO_REMINDER_HOUR;
  const hour12 = hour % 12 || 12;
  const minute = (triggerDate?.getMinutes() ?? TODO_REMINDER_MINUTE)
    .toString()
    .padStart(2, "0");
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${hour12}:${minute} ${meridiem}`;
}

function getTaskNotificationSchedule(
  triggerDate: Date | null,
): TaskNotificationSchedule | null {
  if (!triggerDate) return null;

  const now = new Date();
  
  // If trigger time is now or in the future, schedule at exact time
  if (triggerDate.getTime() >= now.getTime()) {
    return {
      type: "date",
      date: triggerDate,
    };
  }

  // If the time has passed but it's the same calendar day,
  // reschedule for tomorrow at the same time to preserve the exact hour/minute
  if (isSameLocalDate(triggerDate, now)) {
    const tomorrowSameTime = new Date(triggerDate);
    tomorrowSameTime.setDate(tomorrowSameTime.getDate() + 1);
    return {
      type: "date",
      date: tomorrowSameTime,
    };
  }

  // If the date is in the past, don't schedule
  return null;
}

function getExpoNotificationTrigger(
  Notifications: NotificationsModule,
  schedule: TaskNotificationSchedule,
) {
  // schedule.type is always "date" now, but keep structure for safety
  if (schedule.type === "date") {
    return {
      type: "date",
      date: schedule.date,
      channelId: TODO_NOTIFICATION_CHANNEL_ID,
    };
  }

  // Fallback (should not reach here)
  console.warn("[NOTIFY] Unexpected schedule type:", schedule.type);
  return null;
}

function isSameLocalDate(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getTaskTriggerDate(
  taskDate?: string | null,
  taskTime?: string | null,
): Date | null {
  if (!taskDate) return null;

  const dateParts = getAdDateParts(taskDate.trim());
  if (!dateParts) return null;

  const time = parseTaskTime(taskTime);
  const { year, month, day } = dateParts;
  const resultDate = new Date(
    year,
    month - 1,
    day,
    time?.hours ?? TODO_REMINDER_HOUR,
    time?.minutes ?? TODO_REMINDER_MINUTE,
    0,
    0,
  );
  return resultDate;
}

function parseTaskTime(
  taskTime?: string | null,
): { hours: number; minutes: number } | null {
  if (!taskTime) return null;

  const match = taskTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return { hours, minutes };
}

function getAdDateParts(
  taskDate: string,
): { year: number; month: number; day: number } | null {
  const rawParts = getDateParts(taskDate);
  if (!rawParts) return null;

  const [year, month, day] = rawParts;

  if (year >= 2070) {
    return getAdDatePartsFromBs(taskDate);
  }

  if (year >= 1900) {
    return isValidAdDate(year, month, day) ? { year, month, day } : null;
  }

  return getAdDatePartsFromBs(taskDate);
}

function getDateParts(taskDate: string): [number, number, number] | null {
  const parts = taskDate.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  return [parts[0], parts[1], parts[2]];
}

function getAdDatePartsFromBs(
  taskDate: string,
): { year: number; month: number; day: number } | null {
  try {
    const adDate = new NepaliDate(taskDate.replace(/-/g, "/")).toJsDate();
    if (!Number.isNaN(adDate.getTime())) {
      return {
        year: adDate.getFullYear(),
        month: adDate.getMonth() + 1,
        day: adDate.getDate(),
      };
    }
  } catch (error) {
    console.warn("[NOTIFY] Nepali date conversion failed", { bsDate: taskDate, error });
    return null;
  }

  return null;
}

function isValidAdDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
