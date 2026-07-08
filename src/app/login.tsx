import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { getFchvData } from "@/api/services/fchv";
import { doSync } from "@/api/services/sync/sync";
import { Button } from "@/components/button";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  STAFF_ID_KEY,
} from "@/constants/token";
import { useToast } from "@/context/ToastContext";
import storage from "@/utils/storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Lock, User } from "lucide-react-native";
import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

type LoginResponse = {
  access: string;
  refresh: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) {
      showToast(t("login.error_required"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await httpClient.post<LoginResponse>(
        API_LIST.token.post,
        { username: phone.trim(), password: pin },
      );

      const { access, refresh } = response.data;

      const decoded = jwtDecode<{ staff_id: string }>(access);

      await storage.set(ACCESS_TOKEN_KEY, access);
      await storage.set(REFRESH_TOKEN_KEY, refresh);
      await storage.set(STAFF_ID_KEY, decoded?.staff_id);

      try {
        await doSync({ throwOnError: true });
      } catch (syncError) {
        console.error("Initial database sync failed:", syncError);
        showToast(t("login.sync_failed"));
        return;
      }

      try {
        await getFchvData();
      } catch (profileError) {
        console.error("Failed to fetch FCHV profile after login:", profileError);
      }

      showToast(t("login.success"));
      router.replace("/dashboard");
    } catch (error: any) {
      if (error?.response) {
        const status = error.response.status;
        if (status === 401 || status === 400) {
          showToast(t("login.error_invalid"));
        } else {
          showToast(t("login.error_server", { status }));
        }
      } else if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network")
      ) {
        showToast(t("login.error_network"));
      } else {
        showToast(t("login.error_generic"));
      }
    } finally {
      setIsLoading(false);
    }
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
          contentContainerStyle={{ flexGrow: 1, paddingTop: 15 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section: Logo & Title */}
          <View className="items-center pt-16 pb-10 px-8">
            {/* Logo Circle */}
            <View className=" items-center justify-center mb-6">
              <Image
                source={require("../assets/fchv-logo.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </View>
            <Text
              className="font-semibold text-center text-2xl leading-7 mb-2"
              style={{ color: "#0B2545" }}
            >
              {t("login.title")}
            </Text>
          </View>

          {/* Login Card */}
          <View className="mx-5 pt-7">
            {/* USER ID Field */}
            <View className="mb-5">
              <Text
                className="text-md font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#0B2545" }}
              >
                {t("login.health_id_label")}
              </Text>
              <View className="flex-row items-center h-14 rounded-xl border border-gray-300 px-4 bg-white">
                <User size={20} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-md"
                  style={{ color: "#1E293B" }}
                  placeholder={t("login.health_id_placeholder")}
                  placeholderTextColor="#B0B8C4"
                  value={phone}
                  onChangeText={setPhone}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PASSWORD Field */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-md uppercase font-semibold tracking-widest"
                  style={{ color: "#0B2545" }}
                >
                  {t("login.password_label")}
                </Text>
              </View>
              <View className="flex-row items-center h-14 rounded-xl border border-gray-300 px-4 bg-white">
                <Lock size={20} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-md"
                  style={{ color: "#1E293B" }}
                  placeholder={t("login.password_placeholder")}
                  placeholderTextColor="#B0B8C4"
                  secureTextEntry={!showPassword}
                  value={pin}
                  onChangeText={setPin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#94A3B8" />
                  ) : (
                    <Eye size={20} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              isLoading={isLoading}
              title={t("login.login_button")}
            />
          </View>

          {/* Footer moved outside ScrollView to stay at bottom */}
          {/* <View className="items-center w-full pt-10 px-10">
            <Text className="text-center text-gray-400 text-md leading-5">
              {t("login.terms_text")}{" "}
              <Text className="text-primary font-semibold">
                {t("login.terms_link")}
              </Text>
              .
            </Text>
          </View> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
