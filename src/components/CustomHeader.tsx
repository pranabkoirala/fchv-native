import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '../constants/Colors';

type CustomHeaderProps = {
  title: string;
  subtitle?: string;
  rightNode?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  onBackPress?: () => void;
};

export default function CustomHeader({ 
  title, 
  subtitle,
  rightNode, 
  containerStyle,
  className = "pt-4 pb-4 px-5 mt-8",
  onBackPress
}: CustomHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to dashboard if no history exists
      router.replace("/dashboard");
    }
  };

  return (
    <View 
      className={`flex-row items-center justify-between bg-white px-5 pt-12 pb-4 ${className}`}
      style={containerStyle}
    >
      <View className="flex-row items-center flex-1">
        <TouchableOpacity 
          onPress={handleBack} 
          className="mr-3 p-2 rounded-xl border border-slate-100 bg-white shadow-sm"
        >
          <ChevronLeft size={22} color={Colors.textPrimary || "#1E293B"} strokeWidth={2.5} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-semibold text-lg ml-1" style={{ color: Colors.textPrimary || "#1E293B" }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-gray-400 text-xs ml-1 font-medium">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {rightNode ? (
        <View>
          {rightNode}
        </View>
      ) : (
        <View className="w-10" /> 
      )}
    </View>
  );
}
