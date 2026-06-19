import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { ChevronLeft, LucideIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormHeaderProps {
  title: string;
  subTitle?: string;
  rightIcon?: LucideIcon;
  rightIconColor?: string;
  rightIconBgColor?: string;
}

const FormHeader = ({
  title,
  subTitle,
  rightIcon: RightIcon,
  rightIconColor = "#EC4899",
  rightIconBgColor = "bg-pink-100",
}: FormHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white px-6 pb-8 flex flex-row justify-between items-center rounded-b-[40px] mb-6 border-b border-gray-50"
      style={{ paddingTop: Math.max(insets.top + 12, 24) }}
    >
      <View className="flex-row items-center flex-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-gray-50 p-2 rounded-xl"
        >
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-slate-900 leading-tight" numberOfLines={1}>
            {title}
          </Text>
          {subTitle && (
            <Text className="text-slate-500 text-sm font-medium mt-0.5" numberOfLines={1}>
              {subTitle}
            </Text>
          )}
        </View>
      </View>
      {RightIcon && (
        <View className={`w-10 h-10 ${rightIconBgColor} rounded-full items-center justify-center ml-2`}>
          <RightIcon size={20} color={rightIconColor} />
        </View>
      )}
    </View>
  );
};

export default FormHeader;
