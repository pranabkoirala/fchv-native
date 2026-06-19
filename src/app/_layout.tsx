import { doSync } from "@/api/services/sync/sync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { configureNotificationsAsync } from "@/utils/notificationHelper";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { InteractionManager, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "../context/LanguageContext";
import { ToastProvider } from "../context/ToastContext";
import "../global.css";
import "../i18n/config"; // Import i18n config

export default function RootLayout() {
  // Mounts the network listener for data synchronization
  const { isConnected } = useOnlineStatus();

  useEffect(() => {
    if(isConnected){
      doSync();
    }
  }, [isConnected, doSync]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      import("@/hooks/database/db").then(({ initDatabase }) => {
        initDatabase().catch((err) => console.error("DB Init Error:", err));
      });
      configureNotificationsAsync().catch((err) =>
        console.error("Notification setup error:", err),
      );
    });

    return () => task.cancel();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="#f9fafb" />
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <ToastProvider>
            <LanguageProvider>
              <Slot />
            </LanguageProvider>
          </ToastProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
