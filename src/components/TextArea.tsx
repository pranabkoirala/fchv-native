import React from "react";
import { View, Text, TextInput } from "react-native";

interface TextAreaProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  numberOfLines?: number;
}

const TextArea = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  numberOfLines = 4,
}: TextAreaProps) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-slate-700 font-medium mb-1.5 ml-1">{label}</Text>
      )}
      <View
        className={`min-h-[120px] flex-row rounded-xl px-4 py-3 border ${
          error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"
        }`}
      >
        <TextInput
          className="flex-1 text-slate-800 text-base font-medium text-top"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          multiline={true}
          numberOfLines={numberOfLines}
          textAlignVertical="top"
        />
      </View>
      {error ? (
        <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-medium">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default TextArea;
