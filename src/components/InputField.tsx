import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { twMerge } from "tailwind-merge";
import Colors from "../constants/Colors";
import React from "react";

interface InputFieldProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  subLabel?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  error?: string;
}

export default function InputField({
  label,
  subLabel,
  leftIcon,
  containerClassName,
  secureTextEntry,
  error,
  ...props
}: InputFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordType = secureTextEntry;

  return (
    <View className={twMerge("w-full mb-8", containerClassName)}>
      <View className="flex-row items-center justify-between mb-1.5 px-0.5">
        <Text className="text-gray-500 font-semibold text-[13px] uppercase tracking-wider">{label}</Text>
        {subLabel && (
          <Text className="text-gray-400 font-semibold text-[11px] uppercase">{subLabel}</Text>
        )}
      </View>

      <View className="flex-row items-center border rounded-xl px-3 border-gray-200 h-14 pb-1">
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className="flex-1 text-[#1E293B] text-md h-full font-semibold"
          placeholderTextColor="#cbd5e1"
          secureTextEntry={isPasswordType && !isPasswordVisible}
          {...props}
        />

        {isPasswordType && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="ml-2"
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color="#94a3b8" />
            ) : (
              <Eye size={18} color="#94a3b8" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1.5 font-medium">{error}</Text> : null}
    </View>
  );
}
