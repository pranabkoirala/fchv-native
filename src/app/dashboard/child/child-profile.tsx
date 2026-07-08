import ChildCounselingSection from "@/app/dashboard/child/ChildCounselingSection";
import { Skeleton } from "@/components/common/Skeleton";
import CustomHeader from "@/components/CustomHeader";
import NewbornDeathModal from "@/components/forms/NewbornDeathModal";
import BirthRegistrationSection from "@/components/profile/BirthRegistrationSection";
import DeathRegistrationSection from "@/components/profile/DeathRegistrationSection";
import VaccinationSection from "@/components/profile/VaccinationSection";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { getInfantMonitoringById } from "@/hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Activity, Baby, Edit2, MapPin, Smile } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const ChildProfileSkeleton = () => (
  <ScrollView
    className="flex-1"
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
  >
    <View className="px-4 gap-y-3">
      {/* Identity Card */}
      <View className="bg-white p-5 rounded-2xl border border-slate-100">
        <View className="flex-row items-start">
          <Skeleton
            width={56}
            height={56}
            borderRadius={28}
            style={{ marginRight: 16 }}
          />
          <View className="flex-1 gap-2">
            <Skeleton width="60%" height={22} borderRadius={6} />
            <Skeleton width="80%" height={14} borderRadius={4} />
            <Skeleton width="50%" height={14} borderRadius={4} />
          </View>
        </View>
        <View className="flex-row gap-3 mt-5">
          <View className="flex-1 bg-slate-50 py-3 rounded-xl items-center border border-slate-100">
            <Skeleton
              width="40%"
              height={12}
              borderRadius={4}
              style={{ marginBottom: 6 }}
            />
            <Skeleton width="60%" height={18} borderRadius={4} />
          </View>
          <View className="flex-1 bg-slate-50 py-3 rounded-xl items-center border border-slate-100">
            <Skeleton
              width="40%"
              height={12}
              borderRadius={4}
              style={{ marginBottom: 6 }}
            />
            <Skeleton width="60%" height={18} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Birth Info Grid */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
          <Skeleton
            width={40}
            height={40}
            borderRadius={20}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1 gap-1">
            <Skeleton width="60%" height={12} borderRadius={4} />
            <Skeleton width="80%" height={16} borderRadius={4} />
          </View>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
          <Skeleton
            width={40}
            height={40}
            borderRadius={20}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1 gap-1">
            <Skeleton width="60%" height={12} borderRadius={4} />
            <Skeleton width="80%" height={16} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Vaccination Section Skeleton */}
      <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mt-2">
        <View className="p-4 border-b border-slate-50 flex-row items-center">
          <Skeleton
            width={32}
            height={32}
            borderRadius={16}
            style={{ marginRight: 12 }}
          />
          <Skeleton width="45%" height={22} borderRadius={4} />
        </View>
        <View className="p-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={52} borderRadius={10} />
          ))}
        </View>
      </View>
    </View>
  </ScrollView>
);

const toNepaliNumbers = (num: number | string) => {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(
    /[0-9]/g,
    (match) => nepaliDigits[parseInt(match)],
  );
};

const calculateAge = (dobString: string, currentLanguage: string, t: any) => {
  if (!dobString) return "---";
  const dob = new Date(dobString);
  const now = new Date();

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (currentLanguage === "np") {
    if (years >= 1) {
      const yearStr = years > 0 ? `${toNepaliNumbers(years)} ${t("child_profile.identity.years")}` : "";
      const monthStr = months > 0 ? `${toNepaliNumbers(months)} ${t("child_profile.identity.months")}` : "";
      return `${yearStr} ${monthStr}`.trim();
    } else {
      const monthStr = months > 0 ? `${toNepaliNumbers(months)} ${t("child_profile.identity.months")}` : "";
      const dayStr = days > 0 ? `${toNepaliNumbers(days)} ${t("child_profile.identity.days")}` : "";
      return `${monthStr} ${dayStr}`.trim() || `० ${t("child_profile.identity.days")}`;
    }
  } else {
    if (years >= 1) {
      const yearStr = years > 0 ? `${years} ${years === 1 ? "Year" : "Years"}` : "";
      const monthStr = months > 0 ? `${months} ${months === 1 ? "Month" : "Months"}` : "";
      return `${yearStr} ${monthStr}`.trim();
    } else {
      const monthStr = months > 0 ? `${months} ${months === 1 ? "Month" : "Months"}` : "";
      const dayStr = days > 0 ? `${days} ${days === 1 ? "Day" : "Days"}` : "";
      return `${monthStr} ${dayStr}`.trim() || `0 Days`;
    }
  }
};

export default function ChildProfileScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { id, from, fromTab } = useLocalSearchParams<{ id: string; from?: string; fromTab?: string }>();

  const [record, setRecord] = useState<InfantMonitoringStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deathModalVisible, setDeathModalVisible] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const onBackPress = () => {
      if (from === "/dashboard/report") {
        router.replace({
          pathname: from,
          params: { tab: fromTab || "child" },
        } as any);
      } else if (from === "profile" && record?.mother) {
        router.replace({
          pathname: "/dashboard/profile",
          params: { id: record.mother },
        } as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/dashboard/child");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, [from, fromTab, record, router]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchRecord = async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        try {
          const childData = await getInfantMonitoringById(id);
          if (isActive) {
            setRecord(childData);
          }
        } catch (error) {
          console.error("Failed to fetch child record:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      setLoading(true);
      fetchRecord();
      return () => {
        isActive = false;
      };
    }, [id]),
  );



  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <CustomHeader
          title={t("child_profile.title")}
          onBackPress={() => router.back()}
        />
        <ChildProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <Baby size={64} color="#CBD5E1" />
        <Text className="mt-4 text-lg text-slate-500 font-medium">
          {t("profile.states.not_found")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-8 py-3 rounded-full bg-blue-600"
        >
          <Text className="text-white font-semibold">
            {t("profile.states.go_back")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pb-5">
      <StatusBar barStyle="dark-content" className="bg-white" />
      <CustomHeader
        title={t("child_profile.title")}
        onBackPress={() => {
          if (from === "/dashboard/report") {
            router.replace({
              pathname: from,
              params: { tab: fromTab || "child" },
            } as any);
          } else if (from === "profile" && record?.mother) {
            router.replace({
              pathname: "/dashboard/profile",
              params: { id: record.mother },
            } as any);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/dashboard/child");
          }
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
      >
        <View className="px-4 gap-y-3">
          <View className="bg-white p-5 rounded-2xl border border-slate-100">
            <View className="flex-row items-start">
              <View className="w-14 h-14 rounded-full bg-[#E5F5E9] items-center justify-center mr-4">
                <Smile size={28} color="#10B981" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  {record.baby_name && (
                    <Text className="text-slate-800 text-[17px] font-bold">
                      {record.baby_name}
                    </Text>
                  )}
                  {record.status === "dead" && (
                    <View className="flex-row items-center">
                      <Text className="text-rose-600 text-[15px] font-semibold">
                        {" "}
                        ({t("reports.status.deceased")})
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex flex-row justify-between">
                  <View>
                    <Text className="text-[#64748B] text-[15px] mt-1 font-medium">
                      {t("child_profile.dob_label")}:{" "}
                      {language === "en"
                        ? record.date_of_birth
                        : record.date_of_birth
                          ? toNepaliNumbers(AdToBs(record.date_of_birth))
                          : "---"}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/dashboard/profile",
                          params: {
                            id: record.mother,
                            from: `/dashboard/child/child-profile?id=${id}${from ? `&from=${from}` : ""}`,
                          },
                        })
                      }
                      className="flex-row items-center mt-2"
                    >
                      <Text
                        className="text-slate-500 font-medium text-[15px]"
                        numberOfLines={1}
                      >
                        {t("child_page.mother")}:{" "}
                        <Text className="text-slate-700 font-semibold">
                          {record.mother_name || t("child_page.unknown")}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/dashboard/child/add-child",
                        params: { id: record.id, from },
                      })
                    }
                    disabled={record.status === "dead"}
                    className={`ml-2 h-11 w-11 flex items-center justify-center rounded-full ${record.status === "dead" ? "bg-slate-50 opacity-50" : "bg-gray-50"}`}
                  >
                    <Edit2
                      size={16}
                      color={record.status === "dead" ? "#CBD5E1" : "#64748B"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mt-6">
              <View className="flex-1 bg-[#F8FAFC] py-3 rounded-xl items-center border border-slate-100">
                <Text className="text-[13px] text-slate-600 font-medium mb-1 uppercase tracking-tight">
                  {t("child_profile.age")}
                </Text>
                <Text className="text-[15px] font-bold text-[#334155]">
                  {calculateAge(record.date_of_birth || "", language, t)}
                </Text>
              </View>
              <View className="flex-1 bg-[#F8FAFC] py-3 rounded-xl items-center border border-slate-100">
                <Text className="text-[13px] text-slate-600 font-medium mb-1 uppercase tracking-tight">
                  {t("child_profile.reg_date")}
                </Text>
                <Text className="text-[15px] font-bold text-[#334155]">
                  {language === "en"
                    ? record.created_at.split("T")[0]
                    : record.created_at
                      ? toNepaliNumbers(AdToBs(record.created_at.split("T")[0]))
                      : "---"}
                </Text>
              </View>
            </View>
          </View>

          {/* Birth Info Grid */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <MapPin size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                  {t("child_profile.identity.birth_place")}
                </Text>
                <Text className="text-[15px] font-bold text-slate-700 capitalize">
                  {record.birth_place
                    ? t(`child_profile.values.${record.birth_place}`, {
                        defaultValue: record.birth_place.replace("_", " "),
                      })
                    : "---"}
                </Text>
              </View>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
              <View
                className={`w-10 h-10 rounded-full ${record.status === "dead" ? "bg-rose-50" : "bg-emerald-50"} items-center justify-center mr-3`}
              >
                <Activity
                  size={20}
                  color={record.status === "dead" ? "#EF4444" : "#10B981"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                  {t("child_profile.identity.status")}
                </Text>
                <Text
                  className={`text-[15px] font-bold ${record.status === "dead" ? "text-rose-600" : "text-emerald-600"} capitalize`}
                >
                  {record.status
                    ? t(`child_profile.values.${record.status}`, {
                        defaultValue: record.status,
                      })
                    : t("child_profile.values.alive")}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-2">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-violet-50 items-center justify-center mr-3">
                <Baby size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                  {t("child_profile.identity.gender")}
                </Text>
                <Text className="text-[15px] font-bold text-slate-700 capitalize">
                  {record.gender
                    ? t(`child_profile.values.${record.gender.toLowerCase()}`, {
                        defaultValue: record.gender,
                      })
                    : "---"}
                </Text>
              </View>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mr-3">
                <Activity size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                  {t("child_profile.identity.baby_weight")}
                </Text>
                <Text className="text-[15px] font-bold text-slate-700 capitalize">
                  {record.baby_weight
                    ? t(`child_profile.values.${record.baby_weight}`, {
                        defaultValue: record.baby_weight.replace("_", " "),
                      })
                    : "---"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-1">
            <BirthRegistrationSection childId={record.id} disabled={false} />
            {record.status === "dead" && (
              <DeathRegistrationSection childId={record.id} disabled={false} />
            )}
            <VaccinationSection
              childId={record.id}
              childName={record.baby_name || ""}
              dateOfBirth={record.date_of_birth}
              disabled={record.status === "dead"}
            />
            <ChildCounselingSection
              childId={record.id}
              disabled={record.status === "dead"}
              isDead={record.status === "dead"}
            />
          </View>
        </View>

        <View className="px-4 pb-4 pt-2 bg-white border-t border-slate-50">
          <TouchableOpacity
            onPress={() => setDeathModalVisible(true)}
            disabled={record.status === "dead"}
            className={`h-14 rounded-xl flex-row items-center justify-center border ${
              record.status === "dead"
                ? "bg-rose-50 border-rose-200"
                : "bg-slate-50 border-slate-400"
            }`}
          >
            <Activity
              size={20}
              color={record.status === "dead" ? "#EF4444" : "#94A3B8"}
              className="mr-2"
            />
            <Text
              className={`font-bold text-[16px] uppercase tracking-wide ${
                record.status === "dead" ? "text-rose-600" : "text-slate-500"
              }`}
            >
              {record.status === "dead"
                ? t("newborn_death_modal.after_added")
                : t("newborn_death_modal.title")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NewbornDeathModal
        visible={deathModalVisible}
        onClose={() => setDeathModalVisible(false)}
        record={
          {
            id: record.mother,
            mother_name: record.mother_name,
          } as any
        }
        initialChildId={record.id}
        initialChildName={record.baby_name || ""}
        onSuccess={async () => {
          const updated = await getInfantMonitoringById(id!);
          setRecord(updated);
        }}
        showToast={showToast}
      />
    </SafeAreaView>
  );
}
