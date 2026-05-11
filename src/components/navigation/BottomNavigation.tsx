import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, Keyboard, Dimensions } from "react-native";
import { Home, Baby, Plus, BookOpen, FileText } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get('window');

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const hiddenRoutes = ["follow-up", "mother-profile", "mother-list/add-mother", "newborn-death-report"];
  const isSearchActive = (pathname.includes("record") || pathname.includes("report")) && isKeyboardVisible;
  const shouldHide = hiddenRoutes.some(route => pathname.includes(route)) || isKeyboardVisible || isSearchActive;

  if (shouldHide) return null;

  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "child", label: "Child", icon: Baby, path: "/dashboard/child" },
    { id: "record", label: "Register", icon: Plus, path: "/dashboard/record", isAction: true },
    { id: "report", label: "Report", icon: FileText, path: "/dashboard/report" },
    { id: "guide", label: "Guideline", icon: BookOpen, path: "/dashboard/guidelines" },
  ];

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white items-center">
      <View
        className="flex-row items-center bg-white px-2 py-2"
        style={{ width: width * 0.94, height: 72 }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

        if (tab?.isAction) {
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => tab.path && pathname !== tab.path && router.replace(tab.path as any)}
              className="bg-primary -mt-12 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-blue-200 border-4 border-white"
            >
              <Plus size={32} color="white" strokeWidth={3} />
            </TouchableOpacity>
          );
        }

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.path || active) return;
                router.replace(tab.path as any);
              }}
              className="items-center justify-center flex-1 h-full"
            >
              <View className={`w-10 h-10 rounded-2xl items-center justify-center ${active ? 'bg-blue-50 rounded-full' : 'bg-transparent'}`}>
                <Icon
                  size={active ? 22 : 20}
                  color={active ? Colors.primary : "#94A3B8"}
                  strokeWidth={active ? 2.5 : 2}
                />
              </View>
              <Text
                className={`text-[8.5px] mt-0.5 font-bold uppercase tracking-tighter ${active ? "text-primary" : "text-slate-400"}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
