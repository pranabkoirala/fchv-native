import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Baby,
  FileText,
  Heart,
  Hourglass,
  Pencil,
  Plus,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs, BsToAd } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomHeader from "../../../components/CustomHeader";
import MaternalDeathModal from "../../../components/forms/MaternalDeathModal";
import NewbornDeathModal from "../../../components/forms/NewbornDeathModal";
import AbortionSection from "../../../components/profile/AbortionSection";
import CounselingReferralSection from "../../../components/profile/CounselingReferralSection";
import FamilyPlanningSection from "../../../components/profile/FamilyPlanningSection";
import PNCDetailModal from "../../../components/profile/PNCDetailModal";
import PNCModal from "../../../components/profile/PNCModal";
import { useToast } from "../../../context/ToastContext";
import {
  getAbortionByMother,
  getAbortionByMotherAndPregnancy,
} from "../../../hooks/database/models/AbortionModel";
import { getInfantMonitoringsByMother } from "../../../hooks/database/models/InfantMonitoringModel";
import { getMaternalDeathByMother } from "../../../hooks/database/models/MaternalDeathModel";
import { getMotherProfile } from "../../../hooks/database/models/MotherModel";
import { getNewbornDeathByMother } from "../../../hooks/database/models/NewbornDeathModel";
import {
  createPncVisit,
  getPncVisitsByMotherId,
  updatePncVisit,
} from "../../../hooks/database/models/PncVisitModel";
import { getPregnancyByMotherId } from "../../../hooks/database/models/PregnantWomenModal";
import {
  getSupplementByMother,
  SupplementStoreType,
} from "../../../hooks/database/models/SupplementModel";
import { AbortionStoreType } from "../../../hooks/database/types/abortionModal";
import { HmisRecordStoreType } from "../../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { PncVisitStoreType } from "../../../hooks/database/types/pncVisitModal";
import { toNepaliNumbers } from "../../../utils/dateHelper";

const ProfileSkeleton = () => {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
    >
      <View className="px-4 gap-y-4">
        {/* Main Identity Card Skeleton */}
        <View className="bg-white p-6 rounded-xl border border-slate-100">
          <View className="flex-row w-full mb-6">
            <Skeleton
              width={80}
              height={80}
              borderRadius={40}
              style={{ marginRight: 20 }}
            />
            <View className="flex-1 justify-center gap-2">
              <Skeleton width="40%" height={16} borderRadius={4} />
              <Skeleton width="80%" height={28} borderRadius={6} />
              <Skeleton width="60%" height={16} borderRadius={4} />
            </View>
          </View>
          <View className="flex-row items-center justify-between border-t border-slate-100 pt-5">
            <Skeleton width="40%" height={20} borderRadius={4} />
            <Skeleton width="40%" height={20} borderRadius={4} />
          </View>
        </View>

        {/* Dates Grid Skeleton */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white p-4 rounded-xl flex-row items-center border border-slate-100">
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
          <View className="flex-1 bg-white p-4 rounded-xl flex-row items-center border border-slate-100">
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

        {/* Sections Skeletons */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="p-4 border-b border-slate-50 flex-row items-center">
            <Skeleton
              width={32}
              height={32}
              borderRadius={16}
              style={{ marginRight: 12 }}
            />
            <Skeleton width="50%" height={24} borderRadius={4} />
          </View>
          <View className="p-4 flex-row flex-wrap justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <View key={i} className="w-[47%] mb-3">
                <Skeleton width="100%" height={48} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const SectionTitle = ({
  title,
  icon: Icon,
  colorClass,
  bgColor = "bg-white",
}: any) => (
  <View
    className={`flex-row items-center p-4 py-2 rounded-t-xl ${bgColor} border-b border-slate-50`}
  >
    <View
      className={`w-8 h-8 rounded-full items-center justify-center mr-3 bg-gray-100`}
    >
      <Icon size={16} color="#64748B" />
    </View>
    <Text className="text-slate-800 font-semibold text-lg">{title}</Text>
  </View>
);

type DateFormat = "BS" | "AD";

const normalizeDateString = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr === "N/A") return null;
  const pureDate = dateStr.split("T")[0].replace(/\//g, "-").trim();
  return /^\d{4}-\d{1,2}-\d{1,2}$/.test(pureDate) ? pureDate : null;
};

const resolveDateFormat = (
  dateStr: string,
  fallbackFormat: DateFormat,
): DateFormat => {
  const year = parseInt(dateStr.split("-")[0], 10);
  return year >= 2070 ? "BS" : fallbackFormat;
};

const toDisplayNumber = (value: string | number, targetLang: string) =>
  targetLang === "np" ? toNepaliNumbers(value) : String(value);

const parseDateParts = (
  dateStr: string | null | undefined,
  originalFormat: DateFormat,
) => {
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return [];

  try {
    const sourceFormat = resolveDateFormat(normalizedDate, originalFormat);
    const bsDate =
      sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
    return bsDate.split("-").map((part) => parseInt(part, 10));
  } catch (e) {
    console.warn("Date parts conversion error for:", dateStr, e);
    return [];
  }
};

const formatBsDateDisplay = (
  dateStr: string | null | undefined,
  originalFormat: DateFormat,
  targetLang: string,
) => {
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return "---";

  try {
    const sourceFormat = resolveDateFormat(normalizedDate, originalFormat);
    const bsDate =
      sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
    return toDisplayNumber(bsDate, targetLang);
  } catch (e) {
    console.warn("BS date display conversion error for:", dateStr, e);
    return normalizedDate;
  }
};

const toLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr
    .split("-")
    .map((part) => parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toAdDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDaysDiffFromBsEdd = (
  eddStr: string | null | undefined,
  originalFormat: DateFormat,
) => {
  const normalizedDate = normalizeDateString(eddStr);
  if (!normalizedDate) return null;

  try {
    const sourceFormat = resolveDateFormat(normalizedDate, originalFormat);
    const eddBs =
      sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
    const todayBs = AdToBs(toAdDateString(new Date()));
    const eddAdDate = toLocalDate(BsToAd(eddBs));
    const todayAdDate = toLocalDate(BsToAd(todayBs));
    if (!eddAdDate || !todayAdDate) return null;

    const diffTime = eddAdDate.getTime() - todayAdDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    console.warn("EDD remaining days conversion error:", e);
    return null;
  }
};

const calculateEddFromLmp = (lmpDateStr: string | null | undefined) => {
  if (!lmpDateStr || lmpDateStr === "N/A" || lmpDateStr === "") return null;
  try {
    // pregnancy?.lmp_date is BS string
    const adDateStr = BsToAd(lmpDateStr.split("T")[0].replace(/\//g, "-"));
    const lmpDate = new Date(adDateStr);
    if (!isNaN(lmpDate.getTime())) {
      const eddDate = new Date(lmpDate);
      eddDate.setDate(eddDate.getDate() + 280);
      const eddAd = toAdDateString(eddDate);
      return AdToBs(eddAd);
    }
  } catch (e) {
    console.warn("EDD Calculation error:", e);
  }
  return null;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function HmisRecordProfileScreen() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { id, from, fromTab } = useLocalSearchParams<{
    id: string;
    from?: string;
    fromTab?: string;
  }>();
  const { showToast } = useToast();

  const [record, setRecord] = useState<HmisRecordStoreType | null>(null);
  const [supplementsRecord, setSupplementsRecord] =
    useState<SupplementStoreType | null>(null);
  const [existingDeathRecord, setExistingDeathRecord] =
    useState<MaternalDeathStoreType | null>(null);
  const [existingNewbornDeathRecord, setExistingNewbornDeathRecord] =
    useState<NewbornDeathStoreType | null>(null);
  const [abortionRecord, setAbortionRecord] =
    useState<AbortionStoreType | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [mother, setMother] = useState<any>(null);
  const [pregnancy, setPregnancy] = useState<any>(null);

  const [pncVisits, setPncVisits] = useState<PncVisitStoreType[]>([]);
  const [loading, setLoading] = useState(true);

  const [pncModalVisible, setPncModalVisible] = useState(false);
  const [pncDetailVisible, setPncDetailVisible] = useState(false);
  const [pncSlotIndex, setPncSlotIndex] = useState(0);
  const [selectedPncVisit, setSelectedPncVisit] =
    useState<PncVisitStoreType | null>(null);

  const [maternalDeathModalVisible, setMaternalDeathModalVisible] =
    useState(false);
  const [newbornDeathModalVisible, setNewbornDeathModalVisible] =
    useState(false);

  // children linked to the CURRENT pregnancy
  const currentPregnancyChildren = useMemo(
    () => children.filter((c) => pregnancy && c.pregnancy_id === pregnancy.id),
    [children, pregnancy],
  );
  // children not linked to current pregnancy (direct or old pregnancies)
  const otherChildren = useMemo(
    () =>
      children.filter((c) => !pregnancy || c.pregnancy_id !== pregnancy.id),
    [children, pregnancy],
  );

  const totalChildCount = children.length;

  const loadSupplements = async (motherId: string) => {
    try {
      const suppData = await getSupplementByMother(motherId);
      setSupplementsRecord(suppData);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchRecord = async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        try {
          const [mother, pregnancy, pncVisitsLocal, allChildrenList] =
            await Promise.all([
              getMotherProfile(id),
              getPregnancyByMotherId(id),
              getPncVisitsByMotherId(id),
              getInfantMonitoringsByMother(id),
            ]);
          // The first (most recent) child, for HMIS data display
          const childMonitoring = allChildrenList[0] ?? null;

          if (mother) {
            const lmpDate = pregnancy?.lmp_date || mother.lmp;
            const eddDate =
              normalizeDateString(pregnancy?.expected_delivery_date) ||
              normalizeDateString(mother.edd) ||
              calculateEddFromLmp(lmpDate);
            const lmpParts = parseDateParts(lmpDate, "BS");
            const eddParts = parseDateParts(eddDate, "AD");
            const regParts = parseDateParts(mother.regDate, "AD");

            const data: HmisRecordStoreType = {
              id: mother.id,
              serial_no: null,
              date_year: regParts.length >= 3 ? regParts[0] : null,
              date_month: regParts.length >= 3 ? regParts[1] : null,
              date_day: regParts.length >= 3 ? regParts[2] : null,
              mother_name: mother.name,
              mother_age: mother.age,
              lmp_year: lmpParts.length >= 3 ? lmpParts[0] : null,
              lmp_month: lmpParts.length >= 3 ? lmpParts[1] : null,
              lmp_day: lmpParts.length >= 3 ? lmpParts[2] : null,
              edd_year: eddParts.length >= 3 ? eddParts[0] : null,
              edd_month: eddParts.length >= 3 ? eddParts[1] : null,
              edd_day: eddParts.length >= 3 ? eddParts[2] : null,
              counseling_given: null,
              checkup_12: null,
              checkup_20: null,
              checkup_26: null,
              checkup_30: null,
              checkup_34: null,
              checkup_36: null,
              checkup_38: null,
              checkup_40: null,
              checkup_other: null,
              iron_preg_received: null,
              iron_pnc_received: null,
              vit_a_received: null,
              delivery_place: childMonitoring?.birth_place || null,
              newborn_condition: childMonitoring?.baby_weight || null,
              pnc_check_24hr: pncVisitsLocal.length >= 1 ? 1 : null,
              pnc_check_3day: pncVisitsLocal.length >= 2 ? 1 : null,
              pnc_check_7_14day: pncVisitsLocal.length >= 3 ? 1 : null,
              pnc_check_42day: pncVisitsLocal.length >= 4 ? 1 : null,
              pnc_check_other: null,
              family_planning_used: null,
              remarks: childMonitoring?.remarks || null,
              created_at: mother.regDate || "",
              updated_at: mother.regDate || "",
            };

            if (isActive) {
              setRecord(data);
              setMother(mother);
              setPregnancy(pregnancy);
              setChildren(allChildrenList);
              setPncVisits(pncVisitsLocal);
              const deathData = await getMaternalDeathByMother(mother.id);
              setExistingDeathRecord(deathData);
              const newbornDeathData = await getNewbornDeathByMother(mother.id);
              setExistingNewbornDeathRecord(newbornDeathData);
              const abortionData = pregnancy?.id
                ? await getAbortionByMotherAndPregnancy(mother.id, pregnancy.id)
                : await getAbortionByMother(mother.id);
              setAbortionRecord(abortionData);
              await loadSupplements(mother.id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch record:", error);
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

  useEffect(() => {
    const onBackPress = () => {
      if (from) {
        router.replace({
          pathname: from,
          params: fromTab ? { tab: fromTab } : undefined,
        } as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/dashboard/record");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, [from, fromTab, router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <CustomHeader
          title={t("profile.title")}
          onBackPress={() => router.back()}
        />
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <User size={64} color="#CBD5E1" />
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

  const activePregnancy =
    pregnancy &&
    pregnancy.is_current === 1 &&
    !pregnancy.delivered &&
    !pregnancy.ended;
  const profileEddDate = pregnancy
    ? normalizeDateString(pregnancy.expected_delivery_date) ||
      calculateEddFromLmp(pregnancy.lmp_date)
    : null;
  const profileDaysRemaining =
    activePregnancy && profileEddDate
      ? getDaysDiffFromBsEdd(profileEddDate, "AD")
      : null;
  const isOverdue = profileDaysRemaining !== null && profileDaysRemaining < 0;
  const isDueToday = profileDaysRemaining === 0;
  const hasCurrentPregnancyChild = currentPregnancyChildren.length > 0;
  const hasAbortion = abortionRecord?.aborted === 1;
  const addPregnancyDisabled =
    !!existingDeathRecord ||
    (activePregnancy &&
      !hasCurrentPregnancyChild &&
      !isOverdue &&
      !hasAbortion);
  const remainingBadgeClass = isOverdue
    ? "bg-rose-50"
    : isDueToday
      ? "bg-emerald-50"
      : "bg-slate-50";
  const remainingTextClass = isOverdue
    ? "text-rose-700"
    : isDueToday
      ? "text-emerald-700"
      : "text-slate-700";
  const remainingDaysText =
    profileDaysRemaining === null
      ? null
      : t("profile.countdown.days_short", {
          days: toDisplayNumber(Math.abs(profileDaysRemaining), language),
        });
  const remainingText =
    profileDaysRemaining === null
      ? null
      : isDueToday
        ? t("profile.countdown.today_short")
        : `${t("profile.countdown.for_delivery_label")} ${remainingDaysText} ${isOverdue ? t("profile.countdown.overdue_label") : t("profile.countdown.due_label")}`;
  const profileCreatedDate = normalizeDateString(pregnancy?.created_at);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("profile.title")}
        onBackPress={() => {
          if (from) {
            router.replace({
              pathname: from,
              params: fromTab ? { tab: fromTab } : undefined,
            } as any);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/dashboard/record");
          }
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-5 pb-32 gap-y-4 bg-gray-50">
          {/* Profile Header */}
          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <View className="px-5 pt-5 pb-4">
              {/* Identity Row */}
              <View className="flex-row">
                {mother?.image &&
                !mother.image.includes("no-profile-picture-icon") ? (
                  <View className="w-28 h-28 rounded-full bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-slate-100 items-center justify-center overflow-hidden">
                    <Image
                      source={{ uri: mother.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    className={`w-20 h-20 rounded-full items-center justify-center bg-slate-600`}
                  >
                    <Text className="text-white text-[19px] font-bold">
                      {getInitials(record.mother_name || "")}
                    </Text>
                  </View>
                )}

                <View className="flex-1 ml-4 justify-center">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-slate-900 text-xl font-bold leading-tight">
                      {record.mother_name}
                    </Text>
                    {!!existingDeathRecord && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                        <Text className="text-rose-600 text-xs font-semibold">
                          {t("reports.status.deceased")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center mt-2 gap-2">
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                      <User size={11} color="#6366F1" />
                      <Text className="text-indigo-700 text-xs font-semibold ml-1">
                        {toDisplayNumber(record.mother_age ?? 0, language)}{" "}
                        {t("profile.identity.years")}
                      </Text>
                    </View>
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <Heart size={11} color="#059669" />
                      <Text className="text-emerald-700 text-xs font-semibold ml-1">
                        {t("profile.identity.maternal_health")}
                      </Text>
                    </View>
                    {totalChildCount > 0 && (
                      <View className="flex-row items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100">
                        <Baby size={11} color="#D97706" />
                        <Text className="text-amber-700 text-xs font-semibold ml-1">
                          {totalChildCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  className={`w-9 h-9 rounded-full items-center justify-center ${!!existingDeathRecord ? "bg-slate-50" : "bg-slate-100"}`}
                  disabled={!!existingDeathRecord}
                  onPress={() =>
                    router.push({
                      pathname: "/dashboard/profile/complete-profile",
                      params: { id: record.id, from: "profile" },
                    } as any)
                  }
                >
                  <Pencil
                    size={14}
                    color={!!existingDeathRecord ? "#CBD5E1" : "#475569"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              {/* EDD Countdown */}
              {remainingText && (
                <View
                  className={`mt-4 flex-row items-center px-4 py-3 rounded-xl ${remainingBadgeClass}`}
                >
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${isOverdue ? "bg-rose-100" : isDueToday ? "bg-emerald-100" : "bg-indigo-100"}`}
                  >
                    <Hourglass
                      size={14}
                      color={
                        isOverdue
                          ? "#BE123C"
                          : isDueToday
                            ? "#047857"
                            : "#6366F1"
                      }
                    />
                  </View>
                  <Text
                    className={`text-md font-semibold ml-3 ${remainingTextClass}`}
                  >
                    {remainingText}
                  </Text>
                </View>
              )}

              {/* Key Dates */}
              {pregnancy && (
                <View className="mt-4 bg-slate-50 rounded-2xl p-3 py-4">
                  <View className="flex-row">
                    <View className="flex-1 items-center">
                      <View className="flex-row items-center justify-center mb-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5" />
                        <Text className="text-[12px] text-slate-700 font-semibold uppercase tracking-wider">
                          {t("profile.identity.lmp_date")}
                        </Text>
                      </View>
                      <Text className="text-[15px] text-slate-900 font-semibold">
                        {formatBsDateDisplay(
                          pregnancy.lmp_date,
                          "BS",
                          language,
                        )}
                      </Text>
                    </View>
                    <View className="w-px bg-slate-200 self-stretch mx-2" />
                    <View className="flex-1 items-center">
                      <View className="flex-row items-center justify-center mb-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                        <Text className="text-[12px] text-slate-700 font-semibold uppercase tracking-wider">
                          {t("profile.identity.edd_date")}
                        </Text>
                      </View>
                      <Text className="text-[15px] text-slate-900 font-semibold">
                        {formatBsDateDisplay(profileEddDate, "AD", language)}
                      </Text>
                    </View>
                    <View className="w-px bg-slate-200 self-stretch mx-2" />
                    <View className="flex-1 items-center">
                      <View className="flex-row items-center justify-center mb-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                        <Text className="text-[12px] text-slate-700 font-semibold uppercase tracking-wider">
                          {t("profile.quick_stats.reg_date")}
                        </Text>
                      </View>
                      <Text className="text-[15px] text-slate-900 font-semibold">
                        {formatBsDateDisplay(
                          profileCreatedDate,
                          "AD",
                          language,
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Children */}
              {(currentPregnancyChildren.length > 0 ||
                otherChildren.length > 0) && (
                <View className="mt-4">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {currentPregnancyChildren.map((child, idx) => (
                      <TouchableOpacity
                        key={child.id || `current-${idx}`}
                        onPress={() =>
                          router.push({
                            pathname: "/dashboard/child/child-profile",
                            params: { id: child.id, from: "profile" },
                          } as any)
                        }
                        className="flex-row items-center px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100"
                      >
                        <Baby size={14} color="#6366F1" />
                        {child.baby_name ? (
                          <Text className="text-indigo-700 font-semibold text-sm ml-1.5">
                            {child.baby_name}
                          </Text>
                        ) : null}
                        {child.status === "dead" && (
                          <Text className="text-rose-500 text-xs ml-1">
                            {" "}
                            ({t("reports.status.deceased")})
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                    {otherChildren.map((child, idx) => (
                      <TouchableOpacity
                        key={child.id || `other-${idx}`}
                        onPress={() =>
                          router.push({
                            pathname: "/dashboard/child/child-profile",
                            params: { id: child.id, from: "profile" },
                          } as any)
                        }
                        className="flex-row items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <Baby size={14} color="#64748B" />
                        <Text className="text-slate-600 text-sm ml-1.5">
                          {child.baby_name}
                        </Text>
                        {child.status === "dead" && (
                          <Text className="text-rose-500 text-xs ml-1">✕</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Action Buttons */}
              <View className="mt-8 flex-row gap-3">
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/dashboard/record/add-mother",
                      params: {
                        id: record.id,
                        step: "1",
                        from: "profile",
                        mode: "new",
                      },
                    } as any)
                  }
                  disabled={addPregnancyDisabled}
                  className={`flex-1 flex-row items-center justify-center rounded-lg ${addPregnancyDisabled ? "border-slate-200 opacity-50" : "bg-white"}`}
                >
                  <Plus
                    size={16}
                    color={addPregnancyDisabled ? "#CBD5E1" : "#475569"}
                    strokeWidth={3}
                  />
                  <Text
                    className={`font-semibold text-md ml-2 ${addPregnancyDisabled ? "text-slate-300" : "text-[#475569]"}`}
                  >
                    {t("profile.add_pregnancy")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/dashboard/profile/add-child",
                      params: {
                        motherId: record.id,
                        pregnancyId:
                          pregnancy &&
                          pregnancy.is_current === 1 &&
                          !pregnancy.delivered &&
                          !pregnancy.ended
                            ? pregnancy.id
                            : undefined,
                        from: "profile",
                      },
                    } as any)
                  }
                  disabled={!!existingDeathRecord}
                  className={`flex-1 flex-row items-center justify-center ${!!existingDeathRecord ? "border-slate-200 opacity-50" : "bg-white"}`}
                >
                  <Plus
                    size={16}
                    color={!!existingDeathRecord ? "#CBD5E1" : "#475569"}
                    strokeWidth={3}
                  />
                  <Text
                    className={`font-semibold text-md ml-2 ${!!existingDeathRecord ? "text-slate-300" : "text-[#475569]"}`}
                  >
                    {t("profile.add_child")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <SectionTitle
              title={t("profile.family_planning_method")}
              icon={Heart}
            />
            <View className="p-4">
              <FamilyPlanningSection
                motherId={record.id}
                disabled={!!existingDeathRecord}
              />
            </View>
          </View>

          {/* Abortion Section */}
          {(activePregnancy || hasAbortion) && (
            <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <View className="p-4">
                <AbortionSection
                  motherId={record.id}
                  pregnancyId={pregnancy?.id || null}
                  disabled={!!existingDeathRecord}
                  onAbortionRecorded={() => {
                    setAbortionRecord({
                      id: "",
                      mother: record.id,
                      pregnancy: pregnancy?.id || null,
                      aborted: 1,
                      reg_year: null,
                      reg_month: null,
                      is_synced: 0,
                      is_deleted: 0,
                      created_at: "",
                      updated_at: "",
                    });
                    // Also update local pregnancy state to reflect ended
                    if (pregnancy) {
                      setPregnancy({
                        ...pregnancy,
                        ended: 1,
                        is_current: 0,
                      });
                    }
                  }}
                />
              </View>
            </View>
          )}

          <CounselingReferralSection
            key={pregnancy?.id || "no-pregnancy"}
            motherId={record.id}
            disabled={!!existingDeathRecord}
          />

          {currentPregnancyChildren.length > 0 && (
            <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden ">
              <SectionTitle title={t("profile.birth_pnc.title")} icon={Baby} />
              <View className="p-4">
                <View className="flex-row flex-wrap justify-between">
                  {[
                    { key: "hr24", label: t("profile.birth_pnc.hr24") },
                    { key: "day3", label: t("profile.birth_pnc.day3") },
                    { key: "day7_14", label: t("profile.birth_pnc.day7_14") },
                    { key: "day42", label: t("profile.birth_pnc.day42") },
                  ].map((slot, idx) => {
                    const visit = pncVisits[idx];
                    const done = !!visit;
                    return (
                      <TouchableOpacity
                        key={slot.key}
                        activeOpacity={0.8}
                        disabled={!!existingDeathRecord}
                        onPress={() => {
                          setPncSlotIndex(idx);
                          if (done) {
                            setSelectedPncVisit(visit ?? null);
                            setPncDetailVisible(true);
                          } else {
                            setSelectedPncVisit(null);
                            setPncModalVisible(true);
                          }
                        }}
                        className={`px-3 py-3 rounded-md border mb-3 w-[47%] ${done ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-slate-200"} ${!!existingDeathRecord ? "opacity-50" : ""}`}
                      >
                        {done ? (
                          <View className="flex-row items-center px-2 py-1 rounded-full">
                            <Text className="text-emerald-700 text-[12px] font-medium">
                              {t("pregnant_form.options.done")}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            className={`text-[15px] ${done ? "text-emerald-800 font-bold" : "text-slate-700 font-medium"} mb-1`}
                          >
                            {slot.label}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50">
              <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center mr-3">
                <AlertTriangle size={16} color="#E11D48" />
              </View>
              <Text className="text-slate-800 font-semibold text-lg">
                {t("profile.mortality.title")}
              </Text>
            </View>

            <View className="p-4 gap-y-3">
              {/* Maternal Death */}
              <View
                className={`rounded-2xl border overflow-hidden ${!!existingDeathRecord ? "border-rose-100" : "border-slate-100"}`}
              >
                <View
                  className={`px-4 py-3.5 ${!!existingDeathRecord ? "bg-rose-50/50" : "bg-slate-50"}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${!!existingDeathRecord ? "bg-rose-100" : "bg-slate-100"}`}
                      >
                        <User
                          size={16}
                          color={!!existingDeathRecord ? "#BE123C" : "#64748B"}
                          strokeWidth={1.5}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text
                          className={`font-semibold text-[15px] ${!!existingDeathRecord ? "text-rose-700" : "text-slate-800"}`}
                        >
                          {t("profile.mortality.maternal_title")}
                        </Text>
                        <Text
                          className={`text-[13px] italic mt-0.5 ${!!existingDeathRecord ? "text-rose-400" : "text-slate-500"}`}
                        >
                          {t("profile.mortality.maternal_sub")}
                        </Text>
                      </View>
                    </View>
                    {!!existingDeathRecord && (
                      <View className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200">
                        <Text className="text-rose-600 text-[11px] font-bold uppercase tracking-wide">
                          {t("profile.mortality.submitted")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="px-4 py-3 bg-white">
                  <TouchableOpacity
                    onPress={() => setMaternalDeathModalVisible(true)}
                    disabled={!!existingDeathRecord}
                    className={`flex-row items-center justify-center py-2.5 rounded-xl ${
                      !!existingDeathRecord
                        ? "bg-rose-50 border border-rose-100"
                        : "bg-white border-2 border-dashed border-slate-200"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Plus size={15} color="#64748B" strokeWidth={3} />
                      <Text className="text-slate-600 font-semibold text-[13px] ml-1.5">
                        {t("profile.mortality.add")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Newborn Death */}
              <View
                className={`rounded-2xl border overflow-hidden ${!!existingNewbornDeathRecord ? "border-rose-100" : "border-slate-100"}`}
              >
                <View
                  className={`px-4 py-3.5 ${!!existingNewbornDeathRecord ? "bg-rose-50/50" : "bg-slate-50"}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${!!existingNewbornDeathRecord ? "bg-rose-100" : "bg-slate-100"}`}
                      >
                        <Baby
                          size={16}
                          color={
                            !!existingNewbornDeathRecord ? "#BE123C" : "#64748B"
                          }
                          strokeWidth={1.5}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text
                          className={`font-semibold text-[15px] ${!!existingNewbornDeathRecord ? "text-rose-700" : "text-slate-800"}`}
                        >
                          {t("newborn_death_modal.title")}
                        </Text>
                        <Text
                          className={`text-[13px] italic mt-0.5 ${!!existingNewbornDeathRecord ? "text-rose-400" : "text-slate-500"}`}
                        >
                          {t("newborn_death_modal.subtitle")}
                        </Text>
                      </View>
                    </View>
                    {!!existingNewbornDeathRecord && (
                      <View className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200">
                        <Text className="text-rose-600 text-[11px] font-bold uppercase tracking-wide">
                          {t("profile.mortality.submitted")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="px-4 py-3 bg-white">
                  <TouchableOpacity
                    onPress={() => setNewbornDeathModalVisible(true)}
                    disabled={!!existingNewbornDeathRecord}
                    className={`flex-row items-center justify-center py-2.5 rounded-xl ${
                      !!existingNewbornDeathRecord
                        ? "bg-rose-50 border border-rose-100"
                        : "bg-white border-2 border-dashed border-slate-200"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Plus size={15} color="#64748B" strokeWidth={3} />
                      <Text className="text-slate-600 font-semibold text-[13px] ml-1.5">
                        {t("profile.mortality.add")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Remarks */}
          {record.remarks && (
            <View className="bg-white p-5 rounded-md border border-slate-100 mb-6">
              <SectionTitle title={t("profile.remarks")} icon={FileText} />
              <View className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <Text className="text-slate-600 font-medium leading-relaxed text-[13px]">
                  {record.remarks}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Modals */}
        {record && (
          <>
            <MaternalDeathModal
              visible={maternalDeathModalVisible}
              onClose={() => setMaternalDeathModalVisible(false)}
              record={record}
              onSuccess={(data) => setExistingDeathRecord(data)}
              showToast={showToast}
            />
            <NewbornDeathModal
              visible={newbornDeathModalVisible}
              onClose={() => setNewbornDeathModalVisible(false)}
              record={record}
              children={children}
              onSuccess={(data) => setExistingNewbornDeathRecord(data)}
              showToast={showToast}
            />
            <PNCModal
              visible={pncModalVisible}
              onClose={() => setPncModalVisible(false)}
              motherId={record.id}
              slotIndex={pncSlotIndex}
              existingVisits={pncVisits}
              editingVisit={selectedPncVisit}
              onDone={async (bsDate, place) => {
                try {
                  if (selectedPncVisit?.id) {
                    await updatePncVisit(selectedPncVisit.id, {
                      visit_date: bsDate,
                      visit_place: place,
                    });
                  } else {
                    await createPncVisit({
                      mother: record.id,
                      name: record.mother_name ?? undefined,
                      visit_date: bsDate,
                      visit_place: place,
                    });
                  }

                  const newPnc = await getPncVisitsByMotherId(record.id);
                  setPncVisits(newPnc);
                  // update record flags
                  setRecord((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      pnc_check_24hr: newPnc.length >= 1 ? 1 : null,
                      pnc_check_3day: newPnc.length >= 2 ? 1 : null,
                      pnc_check_7_14day: newPnc.length >= 3 ? 1 : null,
                      pnc_check_42day: newPnc.length >= 4 ? 1 : null,
                    } as HmisRecordStoreType;
                  });
                  showToast(t("profile.pnc_modal.success"));
                  setPncModalVisible(false);
                  setSelectedPncVisit(null);
                } catch (e) {
                  console.error(e);
                  Alert.alert(
                    t("profile.pnc_modal.save_failed_title"),
                    t("profile.pnc_modal.save_failed"),
                  );
                }
              }}
            />
            <PNCDetailModal
              visible={pncDetailVisible}
              visit={selectedPncVisit}
              onClose={() => setPncDetailVisible(false)}
              onEdit={() => {
                setPncDetailVisible(false);
                setPncModalVisible(true);
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
