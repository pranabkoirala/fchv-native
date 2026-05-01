import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Pill,
  Lightbulb,
  Milk,
  Salad,
  Droplets,
  Beef,
  Baby,
  Soup,
  Carrot,
  Wheat,
  Dna,
} from "lucide-react-native";
import * as LucideIcons from "lucide-react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";
import CustomHeader from "@/components/CustomHeader";
import nutritionData from "@/assets/data/nutritionData.json";
import AppSegmentedControl from "@/components/common/AppSegmentedControl";
import "../../../global.css";

type TabType = "pregnant" | "child";

interface Content {
  title: string;
  desc: string;
  dosage: string;
  tips: string[];
}

interface NutritionItem {
  id: string;
  icon: string;
  color: string;
  bg: string;
  en: Content;
  np: Content;
}

function NutritionCard({
  item,
  t,
  language,
}: {
  item: NutritionItem;
  t: (key: string) => string;
  language: "en" | "np";
}) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
  const content = item[language];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((prev) => !prev)}
      className="bg-white rounded-3xl mb-4 border border-gray-100 overflow-hidden"
    >
      {/* Header Row */}
      <View className="flex-row items-center p-4">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
          style={{ backgroundColor: item.bg }}
        >
          <IconComponent size={28} color={item.color} strokeWidth={2.5} />
        </View>

        <View className="flex-1">
          <Text className="text-[#1E293B] font-bold text-base">
            {content.title}
          </Text>
          <Text
            className="text-gray-500 font-medium text-[13px] mt-1 leading-[18px]"
            numberOfLines={expanded ? undefined : 2}
          >
            {content.desc}
          </Text>
        </View>

        <View className="bg-gray-50 w-8 h-8 rounded-xl items-center justify-center ml-2">
          {expanded ? (
            <ChevronUp size={16} color="#94a3b8" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={16} color="#94a3b8" strokeWidth={2.5} />
          )}
        </View>
      </View>

      {/* Expanded Content */}
      {expanded && (
        <View className="px-4 pb-4">
          {/* Divider */}
          <View className="h-[1px] bg-gray-100 mb-3" />

          {/* Dosage */}
          <View
            className="rounded-2xl p-3 mb-3"
            style={{ backgroundColor: item.bg }}
          >
            <View className="flex-row items-center mb-1.5">
              <Pill size={14} color={item.color} strokeWidth={2.5} />
              <Text
                className="font-bold text-xs ml-1.5"
                style={{ color: item.color }}
              >
                {t("nutrition_page.dosage_label")}
              </Text>
            </View>
            <Text className="text-[#1E293B] font-bold text-[13px] leading-[18px]">
              {content.dosage}
            </Text>
          </View>

          {/* Tips */}
          <View className="bg-[#FFFBEB] rounded-2xl p-3">
            <View className="flex-row items-center mb-2">
              <Lightbulb size={14} color="#D97706" strokeWidth={2.5} />
              <Text className="text-[#D97706] font-bold text-xs ml-1.5">
                {t("nutrition_page.tips_label")}
              </Text>
            </View>
            {content.tips.map((tip, i) => (
              <View key={i} className="flex-row mb-1.5">
                <Text className="text-[#92400E] font-bold text-xs mr-2">
                  •
                </Text>
                <Text className="text-[#92400E] font-medium text-[13px] leading-[18px] flex-1">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function NutritionsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("pregnant");
  const { t, language } = useLanguage();
  const router = useRouter();

  const items: NutritionItem[] =
    activeTab === "pregnant" ? (nutritionData.pregnant as any) : (nutritionData.child as any);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      <CustomHeader 
        title={t("nutrition_page.title")}
        onBackPress={handleBack}
        className="pt-10 pb-3 px-5"
      />

      <View className="px-5 mt-2 mb-4">
        <AppSegmentedControl
          segmentIndex={activeTab === "pregnant" ? 0 : 1}
          setSegmentIndex={(index) => setActiveTab(index === 0 ? "pregnant" : "child")}
          values={["pregnant", "child"]}
          label={[t("nutrition_page.tabs.pregnant"), t("nutrition_page.tabs.child")]}
          size="large"
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {items.map((item) => (
          <NutritionCard
            key={`${activeTab}-${item.id}`}
            item={item}
            t={t}
            language={language as "en" | "np"}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
