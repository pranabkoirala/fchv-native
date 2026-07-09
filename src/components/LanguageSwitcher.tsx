import { Check, ChevronDown, Globe } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";
import Colors from "../constants/Colors";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleLanguage = async (lang: "en" | "np") => {
    await setLanguage(lang);
    setShowLangDropdown(false);
  };

  return (
    <View
      className="absolute right-0 z-[1000]"
      style={{ top: Math.max(insets.top, 10) }}
    >
      <TouchableOpacity
        onPress={() => setShowLangDropdown(!showLangDropdown)}
        activeOpacity={0.8}
        className="flex-row items-center bg-surface px-4 py-2.5 rounded-full border border-gray-100"
      >
        <Globe size={18} color={Colors.primary} />
        <Text className="text-text-primary font-semibold ml-2 text-sm">
          {language === "en" ? "En" : "Np"}
        </Text>
        <ChevronDown size={16} color={Colors.textSecondary} className="ml-1" />
      </TouchableOpacity>

      {showLangDropdown && (
        <>
          {/* Backdrop to close dropdown */}
          <Pressable
            style={{
              position: "absolute",
              top: -100,
              left: -500,
              right: -100,
              bottom: -1000,
              zIndex: -1,
            }}
            onPress={() => setShowLangDropdown(false)}
          />
          <View className="absolute top-12 right-0 bg-white rounded-2xl border border-gray-100 p-2 min-w-[150px]">
            <TouchableOpacity
              onPress={() => toggleLanguage("en")}
              className={twMerge(
                "flex-row items-center justify-between px-4 py-3 rounded-xl",
                language === "en" ? "bg-primary/10" : "",
              )}
            >
              <Text
                className={twMerge(
                  "text-sm",
                  language === "en"
                    ? "text-primary font-bold"
                    : "text-text-secondary font-medium",
                )}
              >
                English
              </Text>
              {language === "en" && <Check size={16} color={Colors.primary} />}
            </TouchableOpacity>

            <View className="h-[1px] bg-gray-50 mx-2 my-1" />

            <TouchableOpacity
              onPress={() => toggleLanguage("np")}
              className={twMerge(
                "flex-row items-center justify-between px-4 py-3 rounded-xl",
                language === "np" ? "bg-primary/10" : "",
              )}
            >
              <Text
                className={twMerge(
                  "text-sm",
                  language === "np"
                    ? "text-primary font-bold"
                    : "text-text-secondary font-medium",
                )}
              >
                नेपाली
              </Text>
              {language === "np" && <Check size={16} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
