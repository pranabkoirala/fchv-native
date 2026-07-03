import { useLanguage } from "@/context/LanguageContext";
import {
  FchvProfile,
  getLocalFchvProfile,
} from "@/hooks/database/models/FchvProfileModel";
import { useRouter } from "expo-router";
import { CircleUserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const TopHeader = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<FchvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      try {
        const data = await getLocalFchvProfile();
        setProfile(data);
      } catch (e) {
        console.error("Error loading FCHV profile:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fchvName = profile?.user?.name || "FCHV";
  const orgName = profile?.organization?.name || "";

  return (
    <View className="px-5 pt-10 pb-3 flex-row items-center justify-between bg-white border-b border-slate-100">
      <View className="flex-row items-center flex-1">
        <View className="bg-white p-1 rounded-full mr-3">
          <Image
            source={require("../../assets/fchv-logo.png")}
            className="w-11 h-11 rounded-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1 mr-3">
          {loading ? (
            <View className="gap-y-1">
              <View className="h-4 bg-slate-200 rounded w-28" />
              <View className="h-3 bg-slate-100 rounded w-20" />
            </View>
          ) : (
            <>
              <Text
                className="text-slate-900 text-[19px] font-bold leading-tight"
                numberOfLines={1}
              >
                {`${t("common.namaste")}, ${fchvName}`}
              </Text>
              {orgName ? (
                <Text
                  className="text-slate-500 text-[12px] font-medium mt-0.5"
                  numberOfLines={1}
                >
                  {orgName} Hospital
                </Text>
              ) : (
                <Text className="text-slate-400 text-[11px] font-medium mt-0.5">
                  {language === "np" ? "स्वास्थ्य स्वयंसेविका" : "FCHV"}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/dashboard/fchv-profile")}
        className={`w-9 h-9 rounded-full items-center justify-center ${!loading && profile ? "bg-slate-700" : "bg-slate-100"}`}
      >
        {!loading && profile ? (
          <Text className="text-white text-[13px] font-bold">
            {getInitials(fchvName)}
          </Text>
        ) : (
          <CircleUserRound size={22} color="#475569" strokeWidth={2} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TopHeader;
