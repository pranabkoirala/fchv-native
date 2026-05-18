import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";

interface StatCardProps {
  icon?: any;
  iconColor?: string;
  iconBg?: string;
  bg?: string;
  value: number | string;
  label: string;
  delay: number;
  path: string;
  layout?: "default" | "minimal" | "compact";
}

const StatCard = ({ icon: Icon, iconColor, iconBg = "transparent", bg = "white", value, label, delay, path, layout = "default" }: StatCardProps) => {
  const router = useRouter();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);

  if (layout === "compact") {
    return (
      <Animated.View style={{ flex: 1, opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(path as any)}>
          <View style={{ backgroundColor: bg, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: bg === "white" ? 1 : 0, borderColor: "rgba(241, 245, 249, 1)" }}>
            <View style={{ backgroundColor: iconBg, padding: 8, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
              {Icon && <Icon size={18} color={iconColor} strokeWidth={2.5} />}
            </View>
            <View>
              <Text style={{ color: "#0F172A", fontSize: 20, fontWeight: "600", letterSpacing: -0.5 }}>{value}</Text>
              <Text style={{ color: "#64748B", fontSize: 10, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }} numberOfLines={1}>{label}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (layout === "minimal") {
    return (
      <Animated.View style={{ flex: 1, opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(path as any)}>
          <View style={{ backgroundColor: bg, borderRadius: 16, padding: 16, paddingVertical: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 4, height: 24, backgroundColor: iconColor, borderRadius: 4 }} />
            <View>
              <Text style={{ color: "#0F172A", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>{value}</Text>
              <Text style={{ color: "#475569", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }} numberOfLines={1}>{label}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(path as any)}>
        <View style={{ backgroundColor: bg, borderRadius: 20, padding: 16, borderWidth: bg === "white" ? 1 : 0, borderColor: "rgba(241, 245, 249, 0.8)" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            {Icon && (
              <View style={{ backgroundColor: iconBg, width: iconBg === "transparent" ? undefined : 44, height: iconBg === "transparent" ? undefined : 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color={iconColor} strokeWidth={2.5} />
              </View>
            )}
          </View>
          <Text style={{ color: bg === "#FFE4E6" ? "#BE123C" : "#0F172A", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 }}>{value}</Text>
          <Text style={{ color: bg === "#FFE4E6" ? "#E11D48" : "#64748B", fontSize: 13, fontWeight: "500", marginTop: 4 }} numberOfLines={1}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default StatCard;
