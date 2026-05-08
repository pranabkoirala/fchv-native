import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { CircleUserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";

const TopHeader = () => {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View className="px-6 pt-14 pb-4 flex-row justify-between items-center bg-white border-b border-gray-50">
      <View className="flex-row items-center">
        <View className="bg-blue-50 p-1 rounded-xl mr-3">
          <Image 
            source={require("../../assets/fchv-logo.png")} 
            className="w-10 h-10" 
            resizeMode="contain" 
          />
        </View>
        <View>
          <Text className="text-[#1E293B] text-[17px] font-black leading-none">
            {t('header.fchv')}
          </Text>
          <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
            {t('header.community_connect')}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => router.push("/dashboard/settings")} 
        className="bg-gray-50 p-2 rounded-2xl"
      >
        <CircleUserRound size={22} color="#64748B" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

export default TopHeader;
