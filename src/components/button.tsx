import { Save } from "lucide-react-native";
import { ActivityIndicator, TouchableOpacity, Text, View } from "react-native";
import React from "react";

export const Button = ({
  onPress,
  isLoading,
  title,
  icon: Icon = Save,
}: {
  onPress: () => void;
  isLoading?: boolean;
  title: string;
  icon?: any;
}) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    disabled={isLoading}
    className="bg-primary/80 px-5 h-14 flex-row items-center justify-center mb-2"
  >
    {isLoading ? (
      <ActivityIndicator color="white" size="small" />
    ) : (
      <>
        {Icon && <Icon size={18} color="white" strokeWidth={2} />}
        <Text className="text-white font-semibold text-md ml-2">{title}</Text>
      </>
    )}
  </TouchableOpacity>
);
