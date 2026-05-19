import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, Keyboard, Dimensions, Animated } from "react-native";
import { Home, ClipboardList, CheckSquare, BookOpen } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";

const { width } = Dimensions.get('window');

const TabItem = ({ tab, isActive, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;
  const bgOpacityAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.1 : 1,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [isActive]);

  const Icon = tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: "100%", paddingBottom: 25}}
    >
      <Animated.View
        style={{
          padding: 6,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Icon
          size={20}
          color={isActive ? "#3B82F6" : "#64748B"}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </Animated.View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: isActive ? "700" : "600",
          color: isActive ? "#3B82F6" : "#64748B",
        }}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
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
    { id: "home", en_label: "Home", np_label: "गृहपृष्ठ", icon: Home, path: "/dashboard" },
    { id: "report", en_label: "Report", np_label: "रिपोर्ट", icon: ClipboardList, path: "/dashboard/report" },
    { id: "tasks", en_label: "Tasks", np_label: "कार्यहरू", icon: CheckSquare, path: "/dashboard/todo" },
    { id: "guide", en_label: "Guidelines", np_label: "मार्गदर्शन", icon: BookOpen, path: "/dashboard/guidelines" },
  ];

  const checkIsActive = (path: string | null) => {
    if (!path) return false;
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "white",
          paddingBottom: 15,
          paddingTop: 10
        }}
      >
        {tabs.map((tab) => {
          const active = checkIsActive(tab.path);
          return (
            <TabItem
              key={tab.id}
              tab={{ ...tab, label: language === "np" ? tab.np_label : tab.en_label }}
              isActive={active}
              onPress={() => {
                if (!tab.path || active) return;
                router.replace(tab.path as any);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
