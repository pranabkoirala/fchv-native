import CustomHeader from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useLanguage } from "../../context/LanguageContext";

type LanguageOption = {
  code: "en" | "np";
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    code: "np",
    name: "Nepali",
    nativeName: "नेपाली",
    flag: "🇳🇵",
  },
];

export default function ChangeLanguageScreen() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [selected, setSelected] = useState<"en" | "np">(language);

  const handleSelect = (code: "en" | "np") => {
    setSelected(code);
    if (code !== language) {
      setLanguage(code);
    }
  };

  return (
    <View className="flex-1 bg-white pt-10">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <CustomHeader
        onBackPress={() => router.push("/dashboard/fchv-profile")}
        title={t("profile_settings.language_selector")}
      />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Language Cards */}
        <View className="gap-4 mt-8">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;

            return (
              <TouchableOpacity
                key={lang.code}
                activeOpacity={0.85}
                onPress={() => handleSelect(lang.code)}
              >
                <Animated.View
                  className={`bg-white rounded-3xl p-6 border-2 ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-100"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-14 h-14 rounded-2xl items-center justify-center ${
                          isSelected ? "bg-emerald-100" : "bg-gray-50"
                        }`}
                      >
                        <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                      </View>

                      <View className="ml-4">
                        <Text
                          className={`text-lg font-bold ${
                            isSelected ? "text-emerald-700" : "text-gray-800"
                          }`}
                        >
                          {lang.name}
                        </Text>
                        <Text className="text-gray-400 text-sm font-medium mt-0.5">
                          {lang.nativeName}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={16} color="#fff" />}
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
