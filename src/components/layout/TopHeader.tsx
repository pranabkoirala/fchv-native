import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { CircleUserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const TopHeader = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="px-4 pt-16 pb-5 flex-row justify-between items-center bg-[#fff]">
      <View className="flex-row items-center">
        <View className="bg-white p-1 rounded-full mr-3 shadow-sm shadow-slate-200">
          <Image 
            source={require("../../assets/fchv-logo.png")} 
            className="w-11 h-11 rounded-full" 
            resizeMode="cover" 
          />
        </View>
        <View>
          <Text className="text-[#0F172A] text-[20px] font-bold leading-none">
            {t("dashboard.greeting_title", "नमस्ते FCHV")}
          </Text>
          <Text className="text-slate-500 text-[13px] font-medium mt-1">
            {t("dashboard.greeting_sub", "Every visit saves a life.")}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push("/dashboard/fchv-profile")} 
        className="bg-white p-2 rounded-full shadow-sm shadow-slate-200"
      >
        <CircleUserRound size={28} color="#475569" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

export default TopHeader;
