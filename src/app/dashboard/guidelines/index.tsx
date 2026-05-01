import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ImageBackground,
  Image,
  InteractionManager,
  ActivityIndicator
} from "react-native";
import {
  Search,
  Mic,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Salad,
  Users,
  Baby,
  Play,
  ChevronRight,
} from "lucide-react-native";
import { router } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";
import CustomHeader from "@/components/CustomHeader";
import "../../../global.css";


const CATEGORY_CARDS = [
  {
    id: "birth_prep",
    icon: Stethoscope,
    iconColor: "#3B82F6",
    iconBg: "#EFF6FF",
    titleKey: "learn_page.categories.birth_prep",
  },
  {
    id: "nutrition",
    icon: Salad,
    iconColor: "#F97316",
    iconBg: "#FFF7ED",
    titleKey: "learn_page.categories.nutrition",
  },
  {
    id: "family_planning",
    icon: Users,
    iconColor: "#8B5CF6",
    iconBg: "#F5F3FF",
    titleKey: "learn_page.categories.family_planning",
  },
  {
    id: "baby_care",
    icon: Baby,
    iconColor: "#E11D48",
    iconBg: "#FFF1F2",
    titleKey: "learn_page.categories.newborn",
  },
];

const VIDEOS = [
  {
    id: "v1",
    thumb: "https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?w=400&q=80",
    titleKey: "learn_page.videos.v1_title",
    metaKey: "learn_page.videos.v1_meta",
  },
  {
    id: "v2",
    thumb: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80",
    titleKey: "learn_page.videos.v2_title",
    metaKey: "learn_page.videos.v2_meta",
  },
  {
    id: "v3",
    thumb: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80",
    titleKey: "learn_page.videos.v3_title",
    metaKey: "learn_page.videos.v3_meta",
  },
];

const GUIDELINES = [
  { id: "breastfeeding", emoji: "🤱", titleKey: "learn_page.guidelines.breastfeeding", color: "#22C55E", bg: "#F0FFF4" },
  { id: "vaccination", emoji: "💉", titleKey: "learn_page.guidelines.vaccination", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "checkups", emoji: "🩺", titleKey: "learn_page.guidelines.checkups", color: "#E11D48", bg: "#FFF1F2" },
  { id: "mental_health", emoji: "🧘", titleKey: "learn_page.guidelines.mental_health", color: "#8B5CF6", bg: "#F5F3FF" },
];

export default function GuidelinesIndexScreen() {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader 
        title={t("learn_page.header")}
        subtitle={t("learn_page.hero_subtitle")}
        onBackPress={() => router.replace("/dashboard")}
        className="pt-10 pb-2 px-5"
      />

      {!isReady ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      ) : (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        <View className="px-5 mt-6">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/dashboard/guidelines/maternal_health" as any)}
          >
            <ImageBackground
              source={{ uri: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&q=80" }}
              className="rounded-[32px] overflow-hidden h-52"
              imageStyle={{ borderRadius: 20 }}
            >
              {/* Dark overlay */}
              <View className="absolute inset-0 bg-black/40 rounded-[20px]" />

              {/* Content */}
              <View className="flex-1 p-5 justify-between">
                <View className="self-start bg-[#E11D48] w-10 h-10 rounded-2xl items-center justify-center">
                  <ShieldCheck size={20} color="white" strokeWidth={2.5} />
                </View>
                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-white font-bold text-xl">{t("learn_page.hero_title_np")}</Text>
                    <Text className="text-white/80 font-bold text-sm">{t("learn_page.hero_subtitle")}</Text>
                  </View>
                  <View className="bg-white/20 p-2.5 rounded-2xl border border-white/30">
                    <ArrowRight size={18} color="white" strokeWidth={2.5} />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-8">
          <View className="flex-row flex-wrap gap-4">
            {CATEGORY_CARDS.map((cat) => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (cat.id === "nutrition") {
                      router.push("/dashboard/guidelines/nutritions" as any);
                    } else {
                      router.push(`/dashboard/guidelines/${cat.id}` as any);
                    }
                  }}
                  className="bg-white rounded-[28px] p-5 border border-gray-50"
                  style={{ width: "47%" }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                    style={{ backgroundColor: cat.iconBg }}
                  >
                    <Icon size={24} color={cat.iconColor} strokeWidth={2.5} />
                  </View>
                  <Text className="text-[#1E293B] font-bold text-base leading-tight">{t(cat.titleKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* <View className="mt-10">
          <View className="flex-row justify-between items-center px-5 mb-5">
            <Text className="text-[#1E293B] text-xl font-bold">{t("learn_page.recently_viewed")}</Text>
            <TouchableOpacity>
              <Text className="text-[#E11D48] font-bold text-sm">{t("learn_page.view_all")}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
          >
            {VIDEOS.map((v) => (
              <TouchableOpacity
                key={v.id}
                activeOpacity={0.85}
                className="mr-4"
                style={{ width: 180 }}
              >
                <View className="relative rounded-2xl overflow-hidden mb-3" style={{ height: 110 }}>
                  <Image
                    source={{ uri: v.thumb }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-bold/30" />
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-white/90 w-10 h-10 rounded-full items-center justify-center">
                      <Play size={16} color="#E11D48" strokeWidth={2.5} fill="#E11D48" />
                    </View>
                  </View>
                </View>
                <Text className="text-[#1E293B] font-bold text-[14px]" numberOfLines={1}>{t(v.titleKey)}</Text>
                <Text className="text-gray-400 font-bold text-[11px] mt-1">{t(v.metaKey)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View> */}

        <View className="px-5 mt-10">
          <Text className="text-[#1E293B] text-xl font-bold mb-5">{t("learn_page.all_guidelines")}</Text>

          {GUIDELINES.map((item, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.75}
              onPress={() => item.id && router.push(`/dashboard/guidelines/${item.id}` as any)}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-50"
            >
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: item.bg }}>
                <Text className="text-2xl">{item.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#1E293B] font-bold text-base">{t(item.titleKey)}</Text>
              </View>
              <View className="bg-gray-50 p-2 rounded-xl">
                <ChevronRight size={16} color="#94a3b8" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
      )}
    </SafeAreaView>
  );
}
