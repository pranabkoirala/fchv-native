import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Baby,
  Calendar,
  FileText,
  Info,
  Pencil,
  Plus,
  Stethoscope,
  User
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { AdToBs, BsToAd } from "react-native-nepali-picker";
import CustomHeader from "../../../components/CustomHeader";
import MaternalDeathModal from "../../../components/forms/MaternalDeathModal";
import NewbornDeathModal from "../../../components/forms/NewbornDeathModal";
import CounselingReferralSection from "../../../components/profile/CounselingReferralSection";
import FamilyPlanningSection from "../../../components/profile/FamilyPlanningSection";
import Colors from "../../../constants/Colors";
import { useToast } from "../../../context/ToastContext";
import { getInfantMonitoringByMother } from "../../../hooks/database/models/InfantMonitoringModel";
import { getMaternalDeathByMother } from "../../../hooks/database/models/MaternalDeathModel";
import { getMotherProfile } from "../../../hooks/database/models/MotherModel";
import { getNewbornDeathByMother } from "../../../hooks/database/models/NewbornDeathModel";
import { getPregnancyByMotherId } from "../../../hooks/database/models/PregnantWomenModal";
import {
  getSupplementByMother,
  SupplementStoreType,
} from "../../../hooks/database/models/SupplementModel";
import { getVisitsByMotherId } from "../../../hooks/database/models/VisitModel";
import { HmisRecordStoreType } from "../../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { formatBsDate, toNepaliNumbers } from "../../../utils/dateHelper";
import SupplementsScreen from "./supplements";

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

  const [record, setRecord] = useState<HmisRecordStoreType | null>(null);
  const [supplementsRecord, setSupplementsRecord] =
    useState<SupplementStoreType | null>(null);
  const [existingDeathRecord, setExistingDeathRecord] =
    useState<MaternalDeathStoreType | null>(null);
  const [existingNewbornDeathRecord, setExistingNewbornDeathRecord] =
    useState<NewbornDeathStoreType | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [mother, setMother] = useState<any>(null);
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [maternalDeathModalVisible, setMaternalDeathModalVisible] =
    useState(false);
  const [newbornDeathModalVisible, setNewbornDeathModalVisible] =
    useState(false);

  const childEng = children.length > 1 ? "Children" : "Child"
  const childNep = children.length > 1 ? "बच्चाहरू" : "बच्चा"

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
          const [mother, pregnancy, visits, childMonitoring] =
            await Promise.all([
              getMotherProfile(id),
              getPregnancyByMotherId(id),
              getVisitsByMotherId(id),
              getInfantMonitoringByMother(id),
            ]);

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
            const ancVisits = visits.filter((v) => v.visit_type === "ANC");
            const pncVisits = visits.filter((v) => v.visit_type === "PNC");

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
              checkup_12: ancVisits.length >= 1 ? 1 : null,
              checkup_20: ancVisits.length >= 2 ? 1 : null,
              checkup_26: ancVisits.length >= 3 ? 1 : null,
              checkup_30: ancVisits.length >= 4 ? 1 : null,
              checkup_34: ancVisits.length >= 5 ? 1 : null,
              checkup_36: ancVisits.length >= 6 ? 1 : null,
              checkup_38: ancVisits.length >= 7 ? 1 : null,
              checkup_40: ancVisits.length >= 8 ? 1 : null,
              checkup_other: null,
              iron_preg_received: null,
              iron_pnc_received: null,
              vit_a_received: null,
              delivery_place: childMonitoring?.birth_place || null,
              newborn_condition: childMonitoring?.baby_weight || null,
              pnc_check_24hr: pncVisits.length >= 1 ? 1 : null,
              pnc_check_3day: pncVisits.length >= 2 ? 1 : null,
              pnc_check_7_14day: pncVisits.length >= 3 ? 1 : null,
              pnc_check_42day: pncVisits.length >= 4 ? 1 : null,
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
              setChildren(mother.children || []);
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
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-slate-500 font-medium">
          {t("profile.states.loading")}
        </Text>
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
          <View className="bg-white p-6 rounded-xl border border-slate-100">
            <View className="flex-row w-full mb-6">
              <View className="w-20 h-20 rounded-full bg-[#E0F2FE] items-center justify-center mr-5 border-4 border-white shadow-sm shadow-slate-200">
                <User size={40} color="#64748B" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="bg-[#E2E8F0] px-3 py-1 rounded-md">
                    <Text className="text-[#64748B] font-bold text-[10px] uppercase tracking-widest">
                      {t("profile.identity.serial_no")}:{" "}
                      {record.serial_no ?? "N/A"}
                    </Text>
                  </View>
                </View>
                <Text className="text-[#1E293B] text-2xl font-normal leading-tight">
                  {record.mother_name}
                </Text>
                <Text className="text-[#64748B] font-medium text-[15px] mt-1">
                  {toDisplayNumber(record.mother_age ?? 0, language)} {t("profile.identity.years")} •{" "}
                  {t("profile.identity.maternal_health")}
                </Text>
              </View>
              <View>
                <TouchableOpacity className="ml-2 p-3 bg-gray-50 rounded-full" onPress={() =>
                  router.push({
                    pathname: "/dashboard/profile/complete-profile",
                    params: { id: record.id, from: "profile" },
                  } as any)
                }>
                  <Pencil size={16} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {children.length > 0 && (
              <View className="py-4 border-t border-gray-50">
                <View className="flex-row items-center justify-center">
                  <Text className="text-[15px] text-slate-600 font-semibold uppercase tracking-widest pr-2">
                    {language === 'np' ? childNep : childEng}:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {children.map((child, idx) => (
                      <TouchableOpacity
                        key={child.id || idx}
                        onPress={() =>
                          router.push({
                            pathname: "/dashboard/child/child-profile",
                            params: { id: child.id, from: "profile" }
                          } as any)
                        }
                        className="flex-row items-center px-2 rounded-lg border-b border-slate-200"
                      >
                        <Baby size={16} color="#64748B" />
                        <Text className="text-slate-600 text-[15px] pl-1">
                          {child.baby_name || (language === 'np' ? 'नाम नखुलेको' : 'Unnamed')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
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
                className="flex-row items-center justify-end px-2"
              >
                <Plus size={17} color="#64748B" strokeWidth={3} />
                <Text className="text-gray-600 font-semibold ml-2 text-[15px]">
                  {language === "np"
                    ? "गर्भावस्था थप्नुहोस्"
                    : "Add Pregnancy"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/profile/add-child",
                    params: { motherId: record.id, from: "profile" }
                  } as any)
                }
                className="flex-row items-center justify-end px-2"
              >
                <Plus size={17} color="#64748B" strokeWidth={3} />
                <Text className="text-[#475569] font-semibold ml-2 text-[15px]">
                  {language === "np" ? "बच्चा थप्नुहोस्" : "Add Child"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dates Grid */}
          {
            pregnancy?.lmp_date && (
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white p-4 rounded-xl flex-row items-center border border-slate-100 shadow-sm shadow-slate-100">
                  <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3">
                    <Calendar size={18} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] text-slate-600 font-medium">
                      {t("profile.identity.lmp_date")}
                    </Text>
                    <Text className="text-[16px] font-semibold text-slate-800">
                      {formatBsDate(pregnancy.lmp_date, language)}
                    </Text>
                  </View>
                </View>
                {/* Registration Date */}
                <View className="bg-white p-4 rounded-xl border border-slate-100 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                    <Calendar size={18} color="#64748B" />
                  </View>
                  <View className="">
                    <Text className="text-[13px] text-slate-600 font-medium">
                      {t("profile.quick_stats.reg_date")}
                    </Text>
                    <Text className="text-slate-800 font-semibold text-[16px]">
                      {language === 'en' ? pregnancy.created_at.split('T')[0] : pregnancy.created_at ? toNepaliNumbers(AdToBs(pregnancy.created_at.split('T')[0])) : "---"}
                    </Text>
                  </View>
                </View>
              </View>
            )
          }

          {/* Pregnancy Countdown Card */}
          {pregnancy && !pregnancy.delivered && !pregnancy.ended && (pregnancy.expected_delivery_date || pregnancy.lmp_date) && (
            (() => {
              const eddDate =
                normalizeDateString(pregnancy.expected_delivery_date) ||
                calculateEddFromLmp(pregnancy.lmp_date);
              const daysRemaining = getDaysDiffFromBsEdd(eddDate, 'AD');
              if (daysRemaining === null) return null;
              const isOverdue = daysRemaining < 0;
              const isToday = daysRemaining === 0;
              const badgeStyle = isOverdue
                ? "bg-rose-50 border-rose-100"
                : isToday
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-blue-50 border-blue-100";
              const badgeTextStyle = isOverdue
                ? "text-rose-700"
                : isToday
                  ? "text-emerald-700"
                  : "text-blue-700";

              return (
                <View className="bg-white rounded-xl border border-slate-100 p-3 flex-row items-center shadow-sm shadow-slate-100">
                  <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                    <Calendar size={18} color="#2563EB" />
                  </View>
                  <View className="flex-1 pr-3">
                    <Text className="text-[12px] text-slate-500 font-medium">
                      {t("profile.countdown.title")}
                    </Text>
                    <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                      {t("profile.countdown.edd", {
                        date: formatBsDate(pregnancy.lmp_date, language)
                      })}
                    </Text>
                  </View>
                  <View className={`px-3 py-2 rounded-lg border items-center min-w-[88px] ${badgeStyle}`}>
                    <Text className={`text-[11px] font-semibold ${badgeTextStyle}`}>
                      {isOverdue
                        ? t("profile.countdown.overdue_label")
                        : isToday
                          ? t("profile.countdown.today_label")
                          : t("profile.countdown.due_label")}
                    </Text>
                    <Text className={`text-[16px] font-bold mt-0.5 ${badgeTextStyle}`}>
                      {isToday
                        ? t("profile.countdown.today_short")
                        : t("profile.countdown.days_short", {
                          days: toDisplayNumber(Math.abs(daysRemaining), language)
                        })}
                    </Text>
                  </View>
                </View>
              );
            })()
          )}

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <SectionTitle
              title={t("profile.anc.title")}
              icon={Stethoscope}
              colorClass="bg-blue-500"
            />
            <View className="flex-row flex-wrap justify-between p-4 pb-1">
              <VisitBadge
                label={t("profile.anc.wk12")}
                val={record.checkup_12}
              />
              <VisitBadge
                label={t("profile.anc.wk20")}
                val={record.checkup_20}
              />
              <VisitBadge
                label={t("profile.anc.wk26")}
                val={record.checkup_26}
              />
              <VisitBadge
                label={t("profile.anc.wk30")}
                val={record.checkup_30}
              />
              <VisitBadge
                label={t("profile.anc.wk34")}
                val={record.checkup_34}
              />
              <VisitBadge
                label={t("profile.anc.wk36")}
                val={record.checkup_36}
              />
              <VisitBadge
                label={t("profile.anc.wk38")}
                val={record.checkup_38}
              />
              <VisitBadge
                label={t("profile.anc.wk40")}
                val={record.checkup_40}
              />
            </View>
            {record.checkup_other && (
              <View className="mx-4 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex-row items-center">
                <Info size={16} color="#64748B" className="mr-2" />
                <Text className="text-slate-600 text-[13px] font-medium">
                  {record.checkup_other}
                </Text>
              </View>
            )}
          </View>

          <CounselingReferralSection motherId={record.id} />
          <SupplementsScreen motherId={record.id} />

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm shadow-slate-200">
            <SectionTitle
              title={language === "np" ? "परिवार नियोजन साधन प्रयोग" : "Family Planning Method"}
              icon={User}
              colorClass="bg-indigo-600"
            />
            <View className="p-4">
              <FamilyPlanningSection motherId={record.id} />
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm shadow-slate-200">
            <SectionTitle
              title={t("profile.birth_pnc.title")}
              icon={Baby}
              colorClass="bg-indigo-500"
            />
            <View className="p-4">
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {t("profile.birth_pnc.place")}
                  </Text>
                  <Text className="text-slate-800 font-semibold text-[13px]">
                    {record.delivery_place || t("profile.birth_pnc.unrecorded")}
                  </Text>
                </View>
                <View className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                  <Text className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-1">
                    {t("profile.birth_pnc.condition")}
                  </Text>
                  <Text className="text-slate-800 font-semibold text-[13px]">
                    {record.newborn_condition ||
                      t("profile.birth_pnc.unrecorded")}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap justify-between">
                <VisitBadge
                  label={t("profile.birth_pnc.hr24")}
                  val={record.pnc_check_24hr}
                />
                <VisitBadge
                  label={t("profile.birth_pnc.day3")}
                  val={record.pnc_check_3day}
                />
                <VisitBadge
                  label={t("profile.birth_pnc.day7_14")}
                  val={record.pnc_check_7_14day}
                />
                <VisitBadge
                  label={t("profile.birth_pnc.day42")}
                  val={record.pnc_check_42day}
                />
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm shadow-slate-200">
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
                    activeOpacity={0.7}
                    onPress={() => {
                      if (item.key === "maternal") {
                        if (existingDeathRecord) {
                          Alert.alert(
                            t("profile.alerts.already_reported"),
                            t("profile.alerts.maternal_exists"),
                          );
                        } else {
                          setMaternalDeathModalVisible(true);
                        }
                      } else if (item.key === "newborn") {
                        setNewbornDeathModalVisible(true);
                      }
                    }}
                    className={`flex-row items-center justify-center py-2.5 rounded-lg ${item.exists ? "bg-rose-500" : "bg-white border border-slate-200"}`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${item.exists ? "text-white" : "text-slate-600"}`}
                    >
                      {item.key === "newborn"
                        ? item.exists
                          ? t("profile.mortality.add_more")
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
