import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Lock, User, Eye, EyeOff } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "../context/LanguageContext";
import "../global.css";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!phone.trim() || !pin) {
      setErrorMessage(t("login.error_required"));
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Hardcoded login for demonstration
      if (phone === "1" && pin === "1") {
        setErrorMessage("");
        router.replace("/dashboard");
      } else {
        setErrorMessage(t("login.error_invalid"));
      }
    }, 1500);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section: Logo & Title */}
          <View className="items-center pt-16 pb-10 px-8">
            {/* Logo Circle */}
            <View
              className=" items-center justify-center mb-6"
            >
              <Image
                source={require("../assets/fchv-logo.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text
              className="text-center font-semibold text-3xl leading-10 mb-2"
              style={{ color: "#0B2545" }}
            >
              {t("login.title")}
            </Text>

          </View>

          {/* Login Card */}
          <View className="mx-5 pt-7">
            {/* USER ID Field */}
            <View className="mb-5">
              <Text className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#0B2545" }}>
                {t("login.health_id_label")}
              </Text>
              <View
                className="flex-row items-center h-14 rounded-md border border-gray-300 px-4 bg-white"
              >
                <User size={20} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-base"
                  style={{ color: "#1E293B" }}
                  placeholder={t("login.health_id_placeholder")}
                  placeholderTextColor="#B0B8C4"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setErrorMessage("");
                  }}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PASSWORD Field */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm uppercase tracking-widest" style={{ color: "#0B2545" }}>
                  {t("login.password_label")}
                </Text>
              </View>
              <View
                className="flex-row items-center h-14 rounded-md border border-gray-300 px-4 bg-white"
              >
                <Lock size={20} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-base"
                  style={{ color: "#1E293B" }}
                  placeholder={t("login.password_placeholder")}
                  placeholderTextColor="#B0B8C4"
                  secureTextEntry={!showPassword}
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    setErrorMessage("");
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#94A3B8" />
                  ) : (
                    <Eye size={20} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <Text className="text-red-500 font-bold text-sm mb-4 text-center">
                {errorMessage}
              </Text>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isLoading}
              className="w-full h-14 mt-3 bg-primary/80 items-center justify-center flex-row"
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-lg tracking-wide">
                  {t("login.login_button")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        {/* Footer moved outside ScrollView to stay at bottom */}
        <View className="items-center w-full pt-10 px-10">
          <Text className="text-center text-gray-400 text-sm leading-5">
            {t("login.terms_text")}{" "}
            <Text className="text-primary font-semibold">{t("login.terms_link")}</Text>.
          </Text>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
