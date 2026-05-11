import React, { useRef, useCallback } from "react";
import { View, Text, Animated } from "react-native";
import { useFocusEffect } from "expo-router";

interface StatCardProps {
  icon: any;
  iconColor: string;
  iconBg: string;
  value: number | string;
  label: string;
  delay: number;
}

const StatCard = ({ icon: Icon, iconColor, iconBg, value, label, delay }: StatCardProps) => {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: "#F1F5F9",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: iconBg,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={{ color: "#1E293B", fontSize: 24, fontWeight: "800" }}>{value}</Text>
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 10,
            fontWeight: "700",
            marginTop: 2,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

export default StatCard;
