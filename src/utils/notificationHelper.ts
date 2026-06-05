import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { bsToAd } from "./dateHelper";

const TODO_NOTIFICATION_CHANNEL_ID = "todo-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type TodoNotificationInput = {
  id: string;
  title: string;
  taskDate?: string | null;
  taskTime?: string | null;
};

export async function configureNotificationsAsync(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      TODO_NOTIFICATION_CHANNEL_ID,
      {
        name: "Task reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#356169",
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

  if (!triggerDate || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const hasPermission = await requestNotificationPermissionAsync();
  if (!hasPermission) {
    return null;
  }

  await configureNotificationsAsync();

  const notificationId = getTaskNotificationId(id);
  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      title: "FCHV Task Reminder",
      body: `Today you have a task: ${title}`,
      sound: "default",
      data: {
        todoId: id,
        screen: "/dashboard/todo",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: TODO_NOTIFICATION_CHANNEL_ID,
    },
  });

  return notificationId;
}

async function requestNotificationPermissionAsync(): Promise<boolean> {
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

function getTaskTriggerDate(
  taskDate?: string | null,
  taskTime?: string | null,
): Date | null {
  if (!taskDate || !taskTime) return null;

  const adDate = bsToAd(taskDate.trim());
  const dateParts = adDate.split("-").map((part) => Number(part));
  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => !Number.isFinite(part))
  ) {
    return null;
  }

  const time = parseTaskTime(taskTime);
  if (!time) return null;

  const [year, month, day] = dateParts;
  return new Date(year, month - 1, day, time.hours, time.minutes, 0, 0);
}

function parseTaskTime(
  taskTime: string,
): { hours: number; minutes: number } | null {
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
