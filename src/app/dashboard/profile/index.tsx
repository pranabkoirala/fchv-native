import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useHealthIssues } from "@/store/healthIssuesStore";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Baby,
  Calendar,
  FileText,
  Heart,
  Hourglass,
  Pencil,
  Plus,
  Stethoscope,
  User,
  Zap
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { AdToBs, BsToAd } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomHeader from "../../../components/CustomHeader";
import MaternalDeathModal from "../../../components/forms/MaternalDeathModal";
import NewbornDeathModal from "../../../components/forms/NewbornDeathModal";
import ANCModal from "../../../components/profile/ANCModal";
import CounselingReferralSection from "../../../components/profile/CounselingReferralSection";
import FamilyPlanningSection from "../../../components/profile/FamilyPlanningSection";
import PNCDetailModal from "../../../components/profile/PNCDetailModal";
import PNCModal from "../../../components/profile/PNCModal";
import { useToast } from "../../../context/ToastContext";
import { getInfantMonitoringsByMother } from "../../../hooks/database/models/InfantMonitoringModel";
import { getMaternalDeathByMother } from "../../../hooks/database/models/MaternalDeathModel";
import { getMotherProfile } from "../../../hooks/database/models/MotherModel";
import { getNewbornDeathByMother } from "../../../hooks/database/models/NewbornDeathModel";
import { getPregnancyByMotherId } from "../../../hooks/database/models/PregnantWomenModal";
import {
  getSupplementByMother,
  SupplementStoreType,
} from "../../../hooks/database/models/SupplementModel";
import { createVisit, getVisitsByMotherId, updateVisit } from "../../../hooks/database/models/VisitModel";
import { HmisRecordStoreType } from "../../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { VisitStoreType } from "../../../hooks/database/types/visitModal";
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
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginRight: 20 }} />
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
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View className="flex-1 gap-1">
              <Skeleton width="60%" height={12} borderRadius={4} />
              <Skeleton width="80%" height={16} borderRadius={4} />
            </View>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl flex-row items-center border border-slate-100">
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View className="flex-1 gap-1">
              <Skeleton width="60%" height={12} borderRadius={4} />
              <Skeleton width="80%" height={16} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Sections Skeletons */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="p-4 border-b border-slate-50 flex-row items-center">
            <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
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

const SectionTitle = ({ title, icon: Icon, colorClass, bgColor = "bg-white" }: any) => (
  <View className={`flex-row items-center p-4 rounded-t-xl ${bgColor} border-b border-slate-50`}>
    <View
      className={`w-8 h-8 rounded-full items-center justify-center mr-3 bg-gray-100`}
    >
      <Icon size={16} color="#64748B" />
    </View>
    <Text className="text-slate-800 font-semibold text-xl">{title}</Text>
  </View>
);

const VisitBadge = ({ label, val }: any) => (
  <View
    className={`px-3 py-3 rounded-lg flex-row items-center justify-between border mb-3 w-[47%] ${val ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-slate-200"}`}
  >
    <Text
      className={`text-[15px] flex-1 mr-2 ${val ? "text-emerald-800 font-medium" : "text-slate-700 font-medium"}`}
    >
      {label}
    </Text>
    <View
      className={`w-1.5 h-1.5 rounded-full ${val ? "bg-emerald-500" : "bg-slate-200"}`}
    />
  </View>
);

const ProfileDateStat = ({ icon: Icon, label, value, withDivider = false }: any) => (
  <View
    className={`flex-1 items-center justify-center px-2 ${withDivider ? "border-l border-slate-100" : ""}`}
  >
    {/* <Icon size={15} color="#64748B" /> */}
    <Text className="text-[11px] text-slate-500 font-medium mt-2 text-center">
      {label}
    </Text>
    <Text className="text-[13px] text-slate-900 font-bold mt-1 text-center">
      {value}
    </Text>
  </View>
);

type DateFormat = "BS" | "AD";

const normalizeDateString = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr === "N/A") return null;
  const pureDate = dateStr.split("T")[0].replace(/\//g, "-").trim();
  return /^\d{4}-\d{1,2}-\d{1,2}$/.test(pureDate) ? pureDate : null;
};

const resolveDateFormat = (dateStr: string, fallbackFormat: DateFormat): DateFormat => {
  const year = parseInt(dateStr.split("-")[0], 10);
  return year >= 2070 ? "BS" : fallbackFormat;
};

const toDisplayNumber = (value: string | number, targetLang: string) =>
  targetLang === "np" ? toNepaliNumbers(value) : String(value);

const parseDateParts = (dateStr: string | null | undefined, originalFormat: DateFormat) => {
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return [];

  try {
    const sourceFormat = resolveDateFormat(normalizedDate, originalFormat);
    const bsDate = sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
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
    const bsDate = sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
    return toDisplayNumber(bsDate, targetLang);
  } catch (e) {
    console.warn("BS date display conversion error for:", dateStr, e);
    return normalizedDate;
  }
};

const toLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map((part) => parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toAdDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDaysDiffFromBsEdd = (eddStr: string | null | undefined, originalFormat: DateFormat) => {
  const normalizedDate = normalizeDateString(eddStr);
  if (!normalizedDate) return null;

  try {
    const sourceFormat = resolveDateFormat(normalizedDate, originalFormat);
    const eddBs = sourceFormat === "BS" ? normalizedDate : AdToBs(normalizedDate);
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
  if (!lmpDateStr || lmpDateStr === 'N/A' || lmpDateStr === '') return null;
  try {
    // pregnancy?.lmp_date is BS string
    const adDateStr = BsToAd(lmpDateStr.split('T')[0].replace(/\//g, '-'));
    const lmpDate = new Date(adDateStr);
    if (!isNaN(lmpDate.getTime())) {
      const eddDate = new Date(lmpDate);
      eddDate.setDate(eddDate.getDate() + 280);
      return toAdDateString(eddDate);
    }
  } catch (e) {
    console.warn("EDD Calculation error:", e);
  }
  return null;
};

export default function HmisRecordProfileScreen() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { showToast } = useToast();

  const [showHealthIssues, setShowHealthIssues] = useHealthIssues(id || "");
  const [record, setRecord] = useState<HmisRecordStoreType | null>(null);
  const [supplementsRecord, setSupplementsRecord] =
    useState<SupplementStoreType | null>(null);
  const [existingDeathRecord, setExistingDeathRecord] =
    useState<MaternalDeathStoreType | null>(null);
  const [existingNewbornDeathRecord, setExistingNewbornDeathRecord] =
    useState<NewbornDeathStoreType | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [allChildren, setAllChildren] = useState<any[]>([]);
  const [mother, setMother] = useState<any>(null);
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [ancVisits, setAncVisits] = useState<VisitStoreType[]>([]);
  const [pncVisits, setPncVisits] = useState<VisitStoreType[]>([]);
  const [loading, setLoading] = useState(true);

  const [pncModalVisible, setPncModalVisible] = useState(false);
  const [pncDetailVisible, setPncDetailVisible] = useState(false);
  const [pncSlotIndex, setPncSlotIndex] = useState(0);
  const [selectedPncVisit, setSelectedPncVisit] = useState<VisitStoreType | null>(null);
  const [isSavingPnc, setIsSavingPnc] = useState(false);

  const [maternalDeathModalVisible, setMaternalDeathModalVisible] =
    useState(false);
  const [newbornDeathModalVisible, setNewbornDeathModalVisible] =
    useState(false);
  const [ancModalVisible, setAncModalVisible] = useState(false);

  // children linked to the CURRENT pregnancy
  const currentPregnancyChildren = children.filter(
    (c) => pregnancy && c.pregnancy_id === pregnancy.id
  );
  // children not linked to current pregnancy (direct or old pregnancies)
  const otherChildren = allChildren.filter(
    (c) => !pregnancy || c.pregnancy_id !== pregnancy.id
  );

  const totalChildCount = allChildren.length;

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
          const [mother, pregnancy, visits, allChildrenList] =
            await Promise.all([
              getMotherProfile(id),
              getPregnancyByMotherId(id),
              getVisitsByMotherId(id),
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

            // Map visits to ANC/PNC slots
            const ancVisitsList = visits.filter((v) => v.visit_type === "ANC");
            const pncVisitsLocal = visits.filter((v) => v.visit_type === "PNC");

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
              // Sequential mapping for 8 ANC visits
              checkup_12: ancVisitsList.length >= 1 ? 1 : null,
              checkup_20: ancVisitsList.length >= 2 ? 1 : null,
              checkup_26: ancVisitsList.length >= 3 ? 1 : null,
              checkup_30: ancVisitsList.length >= 4 ? 1 : null,
              checkup_34: ancVisitsList.length >= 5 ? 1 : null,
              checkup_36: ancVisitsList.length >= 6 ? 1 : null,
              checkup_38: ancVisitsList.length >= 7 ? 1 : null,
              checkup_40: ancVisitsList.length >= 8 ? 1 : null,
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
              // children linked to current pregnancy shown prominently
              setChildren(allChildrenList);
              setAllChildren(allChildrenList);
              setAncVisits(ancVisitsList);
              setPncVisits(pncVisitsLocal);
              const deathData = await getMaternalDeathByMother(mother.id);
              setExistingDeathRecord(deathData);
              const newbornDeathData = await getNewbornDeathByMother(mother.id);
              setExistingNewbornDeathRecord(newbornDeathData);
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

  const activePregnancy = pregnancy && !pregnancy.delivered && !pregnancy.ended;
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
  const addPregnancyDisabled = !!existingDeathRecord || (activePregnancy && !hasCurrentPregnancyChild && !isOverdue);
  const remainingBadgeClass = isOverdue
    ? "bg-rose-50"
    : isDueToday
      ? "bg-emerald-50"
      : "bg-amber-50";
  const remainingTextClass = isOverdue
    ? "text-rose-700"
    : isDueToday
      ? "text-emerald-700"
      : "text-amber-800";
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
        : `${isOverdue ? t("profile.countdown.overdue_label") : t("profile.countdown.due_label")} ${remainingDaysText}`;
  const profileCreatedDate = normalizeDateString(pregnancy?.created_at);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("profile.title")}
        onBackPress={() => {
          if (from) {
            router.replace(from as any);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/dashboard/record");
          }
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
      >
        <View className="px-4 gap-y-4">
          {/* Main Identity Card */}
          <View className="bg-white px-5 pt-5 pb-4 rounded-3xl border border-slate-100">
            <View className="flex-row w-full mb-5 pr-20">
              <View className="w-24 h-24 rounded-full bg-pink-50 border-2 border-pink-100 items-center justify-center mr-5 overflow-hidden shadow-sm">
                {mother?.image ? (
                  <Image
                    source={{ uri: mother.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center justify-center w-full h-full">
                    <User size={40} color="#EC4899" strokeWidth={1.5} />
                    <View className="absolute bottom-1 right-1 bg-pink-500 rounded-full p-1 border-2 border-white">
                      <Heart size={10} color="white" fill="white" />
                    </View>
                  </View>
                )}
              </View>
              <View className="flex-1 justify-center">
                <View className="flex-row items-center">
                  <Text className="text-[#111827] text-[22px] font-bold leading-tight flex-shrink">
                    {record.mother_name}
                  </Text>
                  {
                    !!existingDeathRecord && (
                      <Text className="text-rose-600 text-[15px] font-semibold"> ({t("reports.status.deceased")})</Text>
                    )
                  }
                </View>
                <Text className="text-[#64748B] font-medium text-[15px] mt-1">
                  {toDisplayNumber(record.mother_age ?? 0, language)} {t("profile.identity.years")} •{" "}
                  {t("profile.identity.maternal_health")}
                </Text>
                {remainingText && (
                  <View className={`self-start flex-row items-center px-4 py-2 rounded-full mt-4 ${remainingBadgeClass}`}>
                    <Hourglass size={15} color={isOverdue ? "#BE123C" : isDueToday ? "#047857" : "#92400E"} />
                    <Text className={`text-[13px] font-bold ml-2 ${remainingTextClass}`}>
                      {remainingText}
                    </Text>
                  </View>
                )}
              </View>
              <View className="absolute right-0 top-0 items-end">
                {/* <View className="bg-[#F1F5F9] px-3 py-2 rounded-full mb-2">
                  <Text className="text-[#475569] font-bold text-[11px]">
                    {t("profile.identity.serial_no")}: {record.serial_no ?? "N/A"}
                  </Text>
                </View> */}
                <TouchableOpacity
                  className={`p-3 rounded-full ${!!existingDeathRecord ? 'bg-slate-50 opacity-50' : 'bg-gray-50'}`}
                  disabled={!!existingDeathRecord}
                  onPress={() =>
                    router.push({
                      pathname: "/dashboard/profile/complete-profile",
                      params: { id: record.id, from: "profile" },
                    } as any)
                  }
                >
                  <Pencil size={16} color={!!existingDeathRecord ? "#CBD5E1" : "#64748B"} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {pregnancy && (
              <View className="flex-row border-y border-slate-100 py-4 mb-1">
                <ProfileDateStat
                  icon={Calendar}
                  label={t("profile.identity.lmp_date")}
                  value={formatBsDateDisplay(pregnancy.lmp_date, "BS", language)}
                />
                <ProfileDateStat
                  icon={Calendar}
                  label={t("profile.quick_stats.reg_date")}
                  value={formatBsDateDisplay(profileCreatedDate, "AD", language)}
                  withDivider
                />
                <ProfileDateStat
                  icon={Calendar}
                  label={t("profile.identity.edd_date")}
                  value={formatBsDateDisplay(profileEddDate, "AD", language)}
                  withDivider
                />
              </View>
            )}

            {/* Children Section - All children on one line */}
            {(currentPregnancyChildren.length > 0 || otherChildren.length > 0) && (
              <View className="pb-2 border-t border-gray-50">
                <View className="flex-row items-center mb-2">
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {/* Current Pregnancy Children */}
                  {currentPregnancyChildren.map((child, idx) => (
                    <TouchableOpacity
                      key={child.id || `current-${idx}`}
                      onPress={() =>
                        router.push({
                          pathname: "/dashboard/child/child-profile",
                          params: { id: child.id, from: "profile" }
                        } as any)
                      }
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100"
                    >
                      <Baby size={14} color="#4F46E5" />
                      {child.baby_name ? (
                        <Text className="text-indigo-700 font-semibold text-[14px] pl-1.5">
                          {child.baby_name}
                        </Text>
                      ) : null}
                      {child.status === 'dead' && (
                        <Text className="text-rose-500 text-[11px] ml-1"> ({t("reports.status.deceased")})</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Other Children */}
                  {otherChildren.map((child, idx) => (
                    <TouchableOpacity
                      key={child.id || `other-${idx}`}
                      onPress={() =>
                        router.push({
                          pathname: "/dashboard/child/child-profile",
                          params: { id: child.id, from: "profile" }
                        } as any)
                      }
                      className="flex-row items-center px-2 py-1 rounded-lg border border-slate-200 bg-white"
                    >
                      <Baby size={14} color="#64748B" />
                      <Text className="text-slate-600 text-[13px] pl-1">
                        {child.baby_name}
                      </Text>
                      {child.status === 'dead' && (
                        <Text className="text-rose-500 text-[11px] ml-1"> ✕</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="flex-row items-center justify-between border-t border-slate-100 pt-2 pt-5 pr-2" >
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/record/add-mother",
                    params: { id: record.id, step: "1", from: "profile", mode: "new" },
                  } as any)
                }
                disabled={addPregnancyDisabled}
                className={`flex-row items-center justify-end px-2 ${addPregnancyDisabled ? 'opacity-50' : ''}`}
              >
                <Plus size={17} color={addPregnancyDisabled ? "#CBD5E1" : "#64748B"} strokeWidth={3} />
                <Text className={`font-semibold ml-2 text-[15px] ${addPregnancyDisabled ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t("profile.add_pregnancy")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/profile/add-child",
                    params: {
                      motherId: record.id,
                      pregnancyId: (pregnancy && !pregnancy.delivered && !pregnancy.ended)
                        ? pregnancy.id
                        : undefined,
                      from: "profile"
                    },
                  } as any)
                }
                disabled={!!existingDeathRecord}
                className={`flex-row items-center justify-end px-2 ${!!existingDeathRecord ? 'opacity-50' : ''}`}
              >
                <Plus size={17} color={!!existingDeathRecord ? "#CBD5E1" : "#64748B"} strokeWidth={3} />
                <Text className={`font-semibold ml-2 text-[15px] ${!!existingDeathRecord ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t("profile.add_child")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Card */}
          <View className="bg-white p-5 rounded-3xl border border-slate-100">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-lg bg-pink-50 items-center justify-center mr-3">
                <Zap size={18} color="#EC4899" />
              </View>
              <Text className="text-slate-800 font-bold text-lg">
                {t("profile.quick_actions")}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={() => setShowHealthIssues(!showHealthIssues)}
                activeOpacity={0.7}
                className="flex-row items-center px-5 py-3.5 rounded-2xl border flex-1 justify-between"
                style={{
                  backgroundColor: showHealthIssues ? "#FFF1F2" : "#F8FAFC",
                  borderColor: showHealthIssues ? "#FECDD3" : "#F1F5F9",
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: showHealthIssues ? "#FFE4E6" : "#E2E8F0",
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      color={showHealthIssues ? "#E11D48" : "#475569"}
                    />
                  </View>
                  <Text
                    className="font-bold text-[15px]"
                    style={{
                      color: showHealthIssues ? "#9F1239" : "#1E293B",
                    }}
                  >
                    {t("profile.health_issues")}
                  </Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: showHealthIssues ? "#E11D48" : "#059669",
                  }}
                >
                  <Text className="text-white text-[12px] font-bold">
                    {showHealthIssues ? t("family_planning.yes") : t("family_planning.no")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 flex flex-row justify-between items-center p-4 overflow-hidden">
            <SectionTitle
              title={t("profile.anc.title")}
              icon={Stethoscope}
              colorClass="bg-blue-500"
            />
            <TouchableOpacity
              className="bg-primary py-2 px-3 rounded-md"
              onPress={() => setAncModalVisible(true)}
            >
              <Text className="text-white font-semibold text-[13px]">{t("anc_modal.view_anc")}</Text>
            </TouchableOpacity>
          </View>

          <CounselingReferralSection motherId={record.id} disabled={!!existingDeathRecord} />
          {/* <SupplementsScreen motherId={record.id} disabled={!!existingDeathRecord} /> */}

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidde">
            <SectionTitle
              title={t("profile.family_planning_method")}
              icon={User}
              colorClass="bg-indigo-600"
            />
            <View className="p-4">
              <FamilyPlanningSection motherId={record.id} disabled={!!existingDeathRecord} />
            </View>
          </View>

          {currentPregnancyChildren.length > 0 && (
            <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden ">
              <SectionTitle
                title={t("profile.birth_pnc.title")}
                icon={Baby}
                colorClass="bg-indigo-500"
              />
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
                        className={`px-3 py-3 rounded-md border mb-3 w-[47%] ${done ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-slate-200"}`}
                      >
                        {done ? (
                          <View className="flex-row items-center px-2 py-1 rounded-full">
                            <Text className="text-emerald-700 text-[12px] font-medium">{t("pregnant_form.options.done")}</Text>
                          </View>
                        ) : (
                          <Text className={`text-[15px] ${done ? "text-emerald-800 font-bold" : "text-slate-700 font-medium"} mb-1`}>
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

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden ">
            <SectionTitle
              title={t("profile.mortality.title")}
              icon={AlertTriangle}
              colorClass="bg-red-500"
              bgColor="bg-red-50/30"
            />
            <View className="gap-y-3 p-4">
              {[
                {
                  title: t("profile.mortality.maternal_title"),
                  subtitle: t("profile.mortality.maternal_sub"),
                  key: "maternal",
                  exists: !!existingDeathRecord,
                },
                {
                  title: t("newborn_death_modal.title"),
                  subtitle: t("newborn_death_modal.subtitle"),
                  key: "newborn",
                  exists: !!existingNewbornDeathRecord,
                },
              ].map((item, idx) => (
                <View
                  key={idx}
                  className={`p-4 rounded-xl border ${item.exists
                    ? "bg-rose-50/50 border-rose-100"
                    : "bg-slate-50 border-slate-100"
                    }`}
                >
                  <View className="mb-4">
                    <Text
                      className={`font-semibold text-[16px] ${item.exists ? "text-rose-600" : "text-slate-800"}`}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className={`text-[15px] font-semibold leading-normal mt-1 ${item.exists ? "text-rose-400" : "text-slate-500"}`}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (item.key === "newborn") {
                        setNewbornDeathModalVisible(true);
                      }
                      else {
                        setMaternalDeathModalVisible(true);
                      }
                    }}
                    disabled={item.exists}
                    className={`flex-row items-center justify-center py-2.5 rounded-lg ${item.exists ? "bg-rose-100 border border-rose-200" : "bg-white border border-slate-200"}`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${item.exists ? "text-rose-400" : "text-slate-600"}`}
                    >
                      {item.key === "newborn"
                        ? item.exists
                          ? t("profile.mortality.submitted")
                          : t("profile.mortality.add")
                        : item.exists
                          ? t("profile.mortality.submitted")
                          : t("profile.mortality.add")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Remarks */}
          {record.remarks && (
            <View className="bg-white p-5 rounded-md border border-slate-100 mb-6">
              <SectionTitle
                title={t("profile.remarks")}
                icon={FileText}
                colorClass="bg-slate-500"
              />
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
            <ANCModal
              visible={ancModalVisible}
              onClose={() => setAncModalVisible(false)}
              ancVisits={ancVisits}
              record={record}
            />
            <PNCModal
              visible={pncModalVisible}
              onClose={() => setPncModalVisible(false)}
              motherId={record.id}
              slotIndex={pncSlotIndex}
              existingVisits={pncVisits}
              editingVisit={selectedPncVisit}
              onDone={async (bsDate, place) => {
                setIsSavingPnc(true);
                try {
                  if (selectedPncVisit?.id) {
                    await updateVisit(selectedPncVisit.id, {
                      visit_date: bsDate,
                      visit_place: place,
                    });
                  } else {
                    await createVisit({
                      mother: record.id,
                      name: record.mother_name ?? undefined,
                      visit_date: bsDate,
                      visit_type: "PNC",
                      visit_place: place,
                    });
                  }

                  const latest = await getVisitsByMotherId(record.id);
                  const newPnc = latest.filter((v) => v.visit_type === "PNC");
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
                  Alert.alert(t("profile.pnc_modal.save_failed_title"), t("profile.pnc_modal.save_failed"));
                } finally {
                  setIsSavingPnc(false);
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
