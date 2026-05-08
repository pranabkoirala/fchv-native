import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { User, Globe, LogOut, X, BookOpen } from "lucide-react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRouter } from "expo-router";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import ModalWithSafeArea from "../common/ModalWithSafeArea";
import DatabaseViewer from "../DatabaseViewer";

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isDbOpen, setIsDbOpen] = useState(false);

  const handleLogout = () => {
    props.navigation.closeDrawer?.();
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => props.navigation.closeDrawer()}
          className="self-end p-2 bg-gray-50 rounded-full mb-5"
        >
          <X size={20} color="#666" />
        </TouchableOpacity>

        {/* Profile Header */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-emerald-50 rounded-full items-center justify-center mb-4">
            <User size={40} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-gray-900">Anita Sharma</Text>
        </View>

        {/* Drawer Items */}
        <View className="flex-1">
          <TouchableOpacity
            onPress={() => {
              props.navigation.closeDrawer();
              router.push("/dashboard/settings");
            }}
            className="flex-row items-center py-4 border-b border-gray-50"
          >
            <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-4">
              <User size={20} color="#3B82F6" />
            </View>
            <Text className="text-gray-700 font-semibold">
              {t("dashboard.drawer.profile")}
            </Text>
          </TouchableOpacity>
          <View>
            <Text>View Db</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              props.navigation.closeDrawer();
              router.push("/dashboard/change-language");
            }}
            className="flex-row items-center py-4 border-b border-gray-50"
          >
            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-4">
              <Globe size={20} color="#6366F1" />
            </View>
            <Text className="text-gray-700 font-semibold">
              {t("dashboard.drawer.language")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              props.navigation.closeDrawer();
              router.push("/dashboard/learn");
            }}
            className="flex-row items-center py-4 border-b border-gray-50"
          >
            <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mr-4">
              <BookOpen size={20} color="#F59E0B" />
            </View>
            <Text className="text-gray-700 font-semibold">
              {t("dashboard.drawer.learn")}
            </Text>
          </TouchableOpacity>
          <Pressable className="rounded-full" onPress={() => setIsDbOpen(true)}><Text className="py-2 px-3 bg-green-500 my-3 text-white rounded-full">Open DB</Text></Pressable>
          <ModalWithSafeArea
            visible={isDbOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setIsDbOpen(false)}
          >
            <DatabaseViewer onClose={() => setIsDbOpen(false)} />
          </ModalWithSafeArea>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center py-5 bg-red-50 rounded-3xl px-6 mb-4"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-4">
            {t("dashboard.drawer.logout")}
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
}
