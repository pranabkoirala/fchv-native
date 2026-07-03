import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

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

const StatCard = ({
  icon: Icon,
  iconColor,
  iconBg = "transparent",
  bg = "white",
  value,
  label,
  delay,
  path,
  layout = "default",
}: StatCardProps) => {
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
      <Animated.View
        style={{
          flex: 1,
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          onPress={() => router.push(path as any)}
          activeOpacity={0.7}
        >
          <View
            style={{
              backgroundColor: bg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {Icon && (
                <View
                  style={{
                    backgroundColor: iconBg || "#F1F5F9",
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={22}
                    color={iconColor || "#64748B"}
                    strokeWidth={2.5}
                  />
                </View>
              )}
              <View>
                <Text
                  style={{
                    color: "#0F172A",
                    fontSize: 22,
                    fontWeight: "600",
                    letterSpacing: -0.5,
                  }}
                >
                  {value}
                </Text>
                <Text
                  style={{
                    color: "#64748B",
                    fontSize: 14,
                    fontWeight: "500",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (layout === "minimal") {
    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          onPress={() => router.push(path as any)}
          activeOpacity={0.7}
        >
          <View
            style={{
              backgroundColor: bg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              overflow: "hidden",
            }}
          >
            <View
              style={{ height: 3, backgroundColor: iconColor || "#CBD5E1" }}
            />
            <View
              style={{
                paddingVertical: 18,
                paddingHorizontal: 12,
                alignItems: "center",
              }}
            >
              {Icon && (
                <View
                  style={{
                    backgroundColor: iconBg || "#F1F5F9",
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Icon
                    size={18}
                    color={iconColor || "#64748B"}
                    strokeWidth={2.5}
                  />
                </View>
              )}
              <Text
                style={{
                  color: "#0F172A",
                  fontSize: 26,
                  fontWeight: "600",
                  letterSpacing: -0.5,
                }}
              >
                {value}
              </Text>
              <Text
                style={{
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: "600",
                  marginTop: 3,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {label}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: animValue,
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(path as any)}
      >
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 3,
              backgroundColor: iconBg !== "transparent" ? iconColor : "#CBD5E1",
              opacity: 0.6,
            }}
          />
          <View style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {Icon && (
                <View
                  style={{
                    backgroundColor:
                      iconBg !== "transparent" ? iconBg : "#F1F5F9",
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={19}
                    color={iconBg !== "transparent" ? iconColor : "#64748B"}
                    strokeWidth={2.5}
                  />
                </View>
              )}
            </View>
            <Text
              style={{
                color: bg === "#FFE4E6" ? "#BE123C" : "#0F172A",
                fontSize: 24,
                fontWeight: "600",
                letterSpacing: -0.5,
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                color: bg === "#FFE4E6" ? "#E11D48" : "#64748B",
                fontSize: 13,
                fontWeight: "500",
                marginTop: 4,
                // lineHeight: 17,
              }}
              // numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default StatCard;
