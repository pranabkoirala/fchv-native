import { useRouter } from "expo-router";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Globe,
  Home,
  LogOut,
  Map,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getFchvData } from "@/api/services/fchv";
import { doSync } from "@/api/services/sync/sync";
import ModalWithSafeArea from "@/components/common/ModalWithSafeArea";
import DatabaseViewer from "@/components/DatabaseViewer";
import { clearDatabase } from "@/hooks/database/db";
import {
  getCurrentFiscalMonth,
  getCurrentFiscalYear,
  getFiscalYearLabel,
  NepaliMonthNames,
  NepaliMonthNamesNp,
} from "@/utils/dateHelper";
import {
  convertToNepaliNumber,
  exportAdolescentIfaToPdf,
  exportAllDataToPdf,
  exportChildDeathToPdf,
  exportCollectedDataToPdf,
  exportInfantCareToPdf,
  exportMaternalDeathToPdf,
  exportNewbornDeathToPdf,
  exportPncMonitoringToPdf,
  exportPregnancyToPdf,
  FISCAL_MONTH_ORDER,
  MonthFilter,
} from "@/utils/pdfGenerator";
import storage from "@/utils/storage";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

type FchvAddress = {
  province: { id: string; name_en: string; name_ne: string };
  district: { id: string; name_en: string; name_ne: string };
  municipality: { id: string; name_en: string; name_ne: string };
  ward: { id: string; number: number };
  locality?: string;
  house_number?: string;
};

type Organization = {
  name: string;
  link: string;
  code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  type: string;
  address: FchvAddress;
};

type FchvProfile = {
  id: string;
  user: { username: string; name: string; user_type: string };
  address: FchvAddress;
  phone_number: string;
  description: string;
  date_of_birth: string;
  photo: string | null;
  training_received_on: string;
  is_active: boolean;
  organization: Organization;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FchvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [exportingItem, setExportingItem] = useState<string | null>(null);

  // Month picker state for report exports
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pendingExportFn, setPendingExportFn] = useState<
    ((filter: MonthFilter) => Promise<void>) | null
  >(null);
  const [pendingExportKey, setPendingExportKey] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(
    null,
  );

  const nepaliYearOptions = useMemo(() => {
    const current = getCurrentFiscalYear();
    return [current - 2, current - 1, current];
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFchvData();
        setProfile(data);
      } catch (e) {
        console.error("error fetching fchv profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t("profile_settings.logout_alert_title") || "Log Out",
      t("profile_settings.logout_alert_msg") ||
        "Are you sure you want to log out? Ensure all data is synced.",
      [
        { text: t("profile_settings.cancel") || "Cancel", style: "cancel" },
        {
          text: t("profile_settings.logout") || "Log Out",
          style: "destructive",
          onPress: async () => {
            await clearDatabase();
            await storage.clear();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await doSync();
      const data = await getFchvData();
      if (data) {
        setProfile(data);
      }
      showToast(t("profile_settings.sync_success_msg"));
    } catch (e) {
      console.error("error syncing data", e);
      showToast(t("profile_settings.sync_failed_msg"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async (
    exportFn: (filter: MonthFilter) => Promise<void>,
    label: string,
    filter: MonthFilter = null,
  ) => {
    if (exportingItem) return;
    try {
      setExportingItem(label);
      setIsExporting(true);
      await exportFn(filter);
      setIsExporting(false);
      setExportingItem(null);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 1500);
    } catch (error) {
      setIsExporting(false);
      setExportingItem(null);
      console.error(error);
      Alert.alert(
        t("profile_settings.export_error_title") || "Export Failed",
        t("profile_settings.export_error_msg") ||
          "Could not export database data.",
      );
    }
  };

  /** Opens the month picker for the given export function */
  const openMonthPicker = (
    exportFn: (filter: MonthFilter) => Promise<void>,
    key: string,
  ) => {
    setPendingExportFn(() => exportFn);
    setPendingExportKey(key);
    setSelectedFiscalYear(null);
    setShowMonthPicker(true);
  };

  /** Called when a month is selected in the picker */
  const onMonthSelected = (filter: MonthFilter) => {
    setShowMonthPicker(false);
    if (pendingExportFn && pendingExportKey) {
      handleExport(pendingExportFn, pendingExportKey, filter);
    }
    setPendingExportFn(null);
    setPendingExportKey(null);
    setSelectedFiscalYear(null);
  };

  /** Closes the picker and resets transient selection state */
  const closeMonthPicker = () => {
    setShowMonthPicker(false);
    setSelectedFiscalYear(null);
  };

  const reportItems = [
    {
      key: "pregnancy",
      label: t("profile_settings.report_pregnancy") || "Pregnancy Records",
      fn: exportPregnancyToPdf,
    },
    {
      key: "maternal_death",
      label: t("profile_settings.report_maternal_death") || "Maternal Death",
      fn: exportMaternalDeathToPdf,
    },
    {
      key: "newborn_death",
      label: t("profile_settings.report_newborn_death") || "Newborn Death",
      fn: exportNewbornDeathToPdf,
    },
    {
      key: "child_death",
      label:
        t("profile_settings.report_child_death") || "Child Death (28d–59m)",
      fn: exportChildDeathToPdf,
    },
    {
      key: "infant_care",
      label: t("profile_settings.report_infant_care") || "Infant Care",
      fn: exportInfantCareToPdf,
    },
    {
      key: "pnc_monitoring",
      label: t("profile_settings.report_pnc_monitoring") || "PNC Monitoring",
      fn: exportPncMonitoringToPdf,
    },
    {
      key: "adolescent_ifa",
      label:
        t("profile_settings.report_adolescent_ifa") ||
        "Iron-consuming adolescent",
      fn: exportAdolescentIfaToPdf,
    },
  ];

  const name = profile?.user?.name || "—";
  const initials =
    name === "—"
      ? ""
      : name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
  const userType = profile?.user?.user_type || "FCHV";
  const username = profile?.user?.username || "";

  const addrName = (a?: { name_en: string; name_ne: string }) => {
    if (!a) return "—";
    return language === "np" ? a.name_ne : a.name_en;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0E7490" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] pb-32">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {isExporting && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={{ paddingTop: insets.top + 10 }}
          className="absolute left-5 right-5 z-50 animate-bounce"
        >
          <View className="bg-blue-600 px-5 py-4 rounded-2xl flex-row items-center">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-semibold text-[15px] ml-3">
              {t("profile_settings.exporting") || "Downloading PDF record..."}
            </Text>
          </View>
        </Animated.View>
      )}

      {showExportSuccess && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={{ paddingTop: insets.top + 10 }}
          className="absolute left-5 right-5 z-50"
        >
          <View className="bg-emerald-500 px-5 py-4 rounded-2xl flex-row items-center">
            <CheckCircle size={20} color="white" />
            <Text className="text-white font-semibold text-[15px] ml-3">
              {t("profile_settings.export_success") ||
                "Downloaded successfully"}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="bg-white px-5 pb-4 flex-row items-center gap-20"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl items-center justify-center"
        >
          <ChevronLeft size={20} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-[19px] font-semibold text-slate-900">
          {t("profile_settings.title")}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Profile Avatar section */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(450)}
          className="mx-5 mt-6"
        >
          <View className="bg-white rounded-3xl border border-slate-100 px-5 pt-8 pb-6 items-center">
            <View className="relative w-24 h-24 self-center items-center justify-center">
              {profile?.photo ? (
                <Image
                  source={{ uri: profile.photo }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-[#0E7490] items-center justify-center">
                  <Text className="text-2xl font-semibold text-white">
                    {initials}
                  </Text>
                </View>
              )}
              {profile?.is_active !== false && (
                <View className="absolute bottom-0 right-1 bg-emerald-500 rounded-full p-0.5">
                  <CheckCircle size={16} color="white" />
                </View>
              )}
            </View>
            <Text className="text-[24px] font-bold text-slate-900 mt-4">
              {name}
            </Text>
            <Text className="text-[15px] text-slate-400 mt-0.5">
              {username}
            </Text>
            <View className="flex-row items-center gap-2.5 mt-3">
              <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <Text className="text-[12px] font-semibold text-emerald-700">
                  {userType}
                </Text>
              </View>
              {profile?.is_active !== false && (
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-[13px] font-semibold text-slate-500">
                    {t("profile_settings.active")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(450)}
          className="flex-row mx-5 mt-5 gap-3"
        >
          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mb-2">
              <MapPin size={18} color="#0284C7" />
            </View>
            <Text
              className="text-[14px] font-semibold text-slate-800 text-center"
              numberOfLines={1}
            >
              {profile?.address?.municipality
                ? addrName(profile.address.municipality)
                : "—"}
            </Text>
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              {t("profile_settings.municipality_label")}
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-violet-50 items-center justify-center mb-2">
              <Building2 size={18} color="#7C3AED" />
            </View>
            <Text
              className="text-[14px] font-semibold text-slate-800 text-center"
              numberOfLines={1}
            >
              {profile?.organization?.code || "—"}
            </Text>
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              {t("profile_settings.org_code_label")}
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mb-2">
              <Shield size={18} color="#059669" />
            </View>
            <Text
              className="text-[14px] font-semibold text-slate-800 text-center"
              numberOfLines={1}
            >
              {`${t("profile_settings.ward")} ${profile?.address?.ward?.number || "—"}`}
            </Text>
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              {t("profile_settings.ward_label")}
            </Text>
          </View>
        </Animated.View>

        {/* Section: Personal Details */}
        <Animated.View entering={FadeInDown.delay(150).duration(450)}>
          <Text className="text-[14px] font-semibold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {t("profile_settings.personal_details")}
          </Text>
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 gap-3">
            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Phone size={15} color="#64748B" />
              </View>
              <Text className="text-[15px] text-slate-500 flex-1">
                {t("profile_settings.phone")}
              </Text>
              <Text className="text-[15px] font-semibold text-slate-800">
                {profile?.phone_number || "—"}
              </Text>
            </View>
            <View className="h-px bg-slate-100" />

            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Calendar size={15} color="#64748B" />
              </View>
              <Text className="text-[15px] text-slate-500 flex-1">
                {t("profile_settings.date_of_birth")}
              </Text>
              <Text className="text-[15px] font-semibold text-slate-800">
                {profile?.date_of_birth || "—"}
              </Text>
            </View>
            <View className="h-px bg-slate-100" />

            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Award size={15} color="#64748B" />
              </View>
              <Text className="text-[15px] text-slate-500 flex-1">
                {t("profile_settings.training_date")}
              </Text>
              <Text className="text-[15px] font-semibold text-slate-800">
                {profile?.training_received_on || "—"}
              </Text>
            </View>

            {profile?.description ? (
              <>
                <View className="h-px bg-slate-100" />
                <View className="pt-2">
                  <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t("profile_settings.about_me")}
                  </Text>
                  <Text className="text-[14px] italic text-slate-600 mt-1">
                    {profile.description}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* Section: Organization */}
        {profile?.organization && (
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <Text className="text-[14px] font-semibold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
              {t("profile_settings.organization")}
            </Text>
            <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mr-3.5 border border-amber-100">
                  <Building2 size={22} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-slate-800">
                    {profile.organization.name || "—"}
                  </Text>
                  <Text className="text-[12px] font-semibold text-slate-400 uppercase mt-0.5">
                    {profile.organization.type || "—"} •{" "}
                    {profile.organization.code || "—"}
                  </Text>
                </View>
              </View>

              {(profile.organization.contact_name ||
                profile.organization.contact_phone) && (
                <View className="bg-slate-50 rounded-xl p-3 mt-3.5 gap-2 border border-slate-100">
                  {profile.organization.contact_name && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[14px] text-slate-500">
                        {t("profile_settings.contact_person")}
                      </Text>
                      <Text className="text-[14px] font-semibold text-slate-700">
                        {profile.organization.contact_name}
                      </Text>
                    </View>
                  )}
                  {profile.organization.contact_phone && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[14px] text-slate-500">
                        {t("profile_settings.phone")}
                      </Text>
                      <Text className="text-[14px] font-semibold text-slate-700">
                        {profile.organization.contact_phone}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Section: Address Details */}
        <Animated.View entering={FadeInDown.delay(250).duration(450)}>
          <Text className="text-[14px] font-semibold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {t("profile_settings.address_details")}
          </Text>

          {/* Card 1: Org Address */}
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 relative overflow-hidden mb-3">
            {/* Watermark Map Icon */}
            <View
              className="absolute right-4 bottom-2 opacity-[0.07]"
              pointerEvents="none"
            >
              <Map size={72} color="#475569" strokeWidth={1.5} />
            </View>

            <View className="flex-row items-center mb-4">
              <Building2 size={15} color="#64748B" />
              <Text className="text-[12px] font-bold text-slate-500 ml-2 uppercase tracking-wide">
                {t("profile_settings.organization_address")}
              </Text>
            </View>

            <View className="flex-row gap-10 mb-3">
              <View>
                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t("profile_settings.province")}
                </Text>
                <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                  {profile?.organization?.address
                    ? addrName(profile.organization.address.province)
                    : "—"}
                </Text>
              </View>
              <View>
                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t("profile_settings.district")}
                </Text>
                <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                  {profile?.organization?.address
                    ? addrName(profile.organization.address.district)
                    : "—"}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                {t("profile_settings.municipality")}
              </Text>
              <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                {profile?.organization?.address
                  ? `${addrName(profile.organization.address.municipality)} (${t("profile_settings.ward")} ${profile.organization.address.ward?.number || "—"})`
                  : "—"}
              </Text>
            </View>
          </View>

          {/* Card 2: FCHV Address */}
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
            {/* Watermark Home Icon */}
            <View
              className="absolute right-4 bottom-2 opacity-[0.07]"
              pointerEvents="none"
            >
              <Home size={72} color="#475569" strokeWidth={1.5} />
            </View>

            <View className="flex-row items-center mb-4">
              <MapPin size={15} color="#64748B" />
              <Text className="text-[12px] font-semibold text-slate-500 ml-2 uppercase tracking-wide">
                {t("profile_settings.fchv_address")}
              </Text>
            </View>

            <View className="flex-row gap-10 mb-3">
              <View>
                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t("profile_settings.province")}
                </Text>
                <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                  {profile?.address ? addrName(profile.address.province) : "—"}
                </Text>
              </View>
              <View>
                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t("profile_settings.district")}
                </Text>
                <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                  {profile?.address ? addrName(profile.address.district) : "—"}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                {t("profile_settings.municipality_locality")}
              </Text>
              <Text className="text-[15px] font-semibold text-slate-800 mt-0.5">
                {profile?.address
                  ? `${addrName(profile.address.municipality)}${profile.address.locality ? `, ${profile.address.locality}` : ""} (${t("profile_settings.ward")} ${profile.address.ward?.number || "—"})`
                  : "—"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Section: Settings */}
        <Animated.View entering={FadeInDown.delay(300).duration(450)}>
          <Text className="text-[14px] font-semibold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {t("profile_settings.settings")}
          </Text>
          <View className="mx-5 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Language */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/dashboard/change-language")}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center mr-3 border border-indigo-100">
                <Globe size={15} color="#6366F1" />
              </View>
              <Text className="text-[15px] font-semibold text-slate-800 flex-1">
                {t("profile_settings.language") || "Language"}
              </Text>
              <Text className="text-[14px] font-semibold text-slate-400 mr-2">
                {language === "np"
                  ? t("profile_settings.nepali")
                  : t("profile_settings.english")}
              </Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Sync */}
            <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
              <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
                <RefreshCw size={15} color="#10B981" />
              </View>
              <Text className="text-[15px] font-semibold text-slate-800 flex-1">
                {t("profile_settings.data_sync")}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSync}
                disabled={isSyncing}
                className="px-4 py-1.5 rounded-lg bg-[#2D4A43] items-center justify-center"
              >
                <Text className="text-[13px] font-semibold text-white">
                  {isSyncing
                    ? t("profile_settings.syncing")
                    : t("profile_settings.sync_now")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DB Inspector */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDbOpen(true)}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-3 border border-amber-100">
                <Database size={15} color="#F59E0B" />
              </View>
              <Text className="text-[15px] font-semibold text-slate-800 flex-1">
                {t("profile_settings.db_inspector") || "Database Inspector"}
              </Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Export Reports */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowReports(!showReports)}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3 border border-blue-100">
                <Download size={15} color="#3B82F6" />
              </View>
              <Text className="text-[15px] font-semibold text-slate-800 flex-1">
                {t("profile_settings.export_data")}
              </Text>
              {showReports ? (
                <ChevronDown size={16} color="#94A3B8" />
              ) : (
                <ChevronRight size={16} color="#94A3B8" />
              )}
            </TouchableOpacity>

            {/* Reports Expandable Submenu */}
            {showReports && (
              <View className="bg-slate-50 px-4 py-2 border-b border-slate-100 gap-1.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    openMonthPicker(exportAllDataToPdf, "all")
                  }
                  disabled={!!exportingItem}
                  className="flex-row items-center py-2 border-b border-slate-100"
                >
                  <View className="w-7 h-7 rounded-lg bg-white border border-slate-100 items-center justify-center mr-3">
                    <Download size={12} color="#64748B" />
                  </View>
                  <Text className="flex-1 text-[15px] font-semibold text-gray-700">
                    {t("profile_settings.download_all")}
                  </Text>
                  {exportingItem === "all" && (
                    <ActivityIndicator size="small" color="#475569" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    openMonthPicker(exportCollectedDataToPdf, "collected_data")
                  }
                  disabled={!!exportingItem}
                  className="flex-row items-center py-2 border-b border-slate-100"
                >
                  <View className="w-7 h-7 rounded-lg bg-white border border-slate-100 items-center justify-center mr-3">
                    <Download size={12} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-gray-700">
                      {t("profile_settings.download_collected_data")}
                    </Text>
                  </View>
                  {exportingItem === "collected_data" && (
                    <ActivityIndicator size="small" color="#059669" />
                  )}
                </TouchableOpacity>

                {reportItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => openMonthPicker(item.fn, item.key)}
                    disabled={!!exportingItem}
                    className={`flex-row items-center py-2.5 ${idx !== reportItems.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <View className="w-7 h-7 rounded-lg bg-white border border-slate-100 items-center justify-center mr-3">
                      <Download size={12} color="#64748B" />
                    </View>
                    <Text className="flex-1 text-[15px] font-semibold text-slate-700">
                      {item.label}
                    </Text>
                    {exportingItem === item.key && (
                      <ActivityIndicator size="small" color="#64748B" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Log Out */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              className="flex-row items-center px-4 py-3.5"
            >
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center mr-3 border border-red-100">
                <LogOut size={15} color="#EF4444" />
              </View>
              <Text className="text-[15px] font-semibold text-red-500 flex-1">
                {t("profile_settings.logout") || "Log Out"}
              </Text>
              <ChevronRight size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Database Inspector Modal */}
      <ModalWithSafeArea
        visible={isDbOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsDbOpen(false)}
      >
        <DatabaseViewer onClose={() => setIsDbOpen(false)} />
      </ModalWithSafeArea>

      {/* Fiscal Year / Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => {
          closeMonthPicker();
        }}
      >
        <Pressable
          onPress={() => {
            closeMonthPicker();
          }}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: insets.bottom + 20,
              maxHeight: "85%",
            }}
          >
            {/* ── Drag handle + header ─────────────────────────────────── */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-slate-200 mb-4" />
              <View className="flex-row items-center justify-between w-full px-6 pb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-[16px] font-medium text-slate-800">
                    {pendingExportKey === "all"
                      ? t("profile_settings.select_fiscal_year") ||
                        "Select Fiscal Year"
                      : pendingExportKey === "collected_data"
                        ? t("profile_settings.select_collected_period") ||
                          "Select Period"
                        : t("profile_settings.select_year_label") ||
                          "Select Fiscal Year"}
                  </Text>
                  <Text className="text-[12px] text-slate-400 mt-1">
                    {pendingExportKey === "all"
                      ? t("profile_settings.select_fiscal_year_subtitle") ||
                        "Choose a fiscal year (Shrawan–Ashar)"
                      : pendingExportKey === "collected_data"
                        ? t(
                            "profile_settings.select_collected_period_subtitle",
                          ) || "Choose a fiscal year to download its data"
                        : t("profile_settings.select_year_subtitle") ||
                          "Tap a year to download that fiscal year's data"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    closeMonthPicker();
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
                >
                  <X size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 mx-6" />

            <ScrollView
              className="px-6 pt-5"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Stage 1: choose a fiscal year ─────────────────────── */}
              {selectedFiscalYear === null ? (
                <>
                  {/* "All Fiscal Years" — only for "Download All Data" */}
                  {pendingExportKey === "all" && (
                    <TouchableOpacity
                      onPress={() => onMonthSelected(null)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-3.5 px-4 mb-5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <View className="flex-1">
                        <Text className="text-[15px] font-normal text-slate-700">
                          {t("profile_settings.download_all_years") ||
                            "Download All Fiscal Years"}
                        </Text>
                        <Text className="text-[12px] text-slate-400 mt-0.5">
                          {t("profile_settings.download_all_years_subtitle") ||
                            "Export all data across all fiscal years"}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}

                  <Text className="text-[12px] font-normal text-slate-400 mb-3">
                    {t("profile_settings.choose_fiscal_year") ||
                      "Choose a fiscal year"}
                  </Text>

                  <View className="gap-2 pb-8">
                    {nepaliYearOptions.map((yr) => {
                      const isCurrent = yr === getCurrentFiscalYear();
                      return (
                        <TouchableOpacity
                          key={yr}
                          onPress={() => setSelectedFiscalYear(yr)}
                          activeOpacity={0.6}
                          className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl border ${
                            isCurrent
                              ? "border-slate-200 bg-white"
                              : "border-slate-100 bg-white"
                          }`}
                        >
                          <View className="flex-row items-center">
                            <Text className="text-[15px] font-normal text-slate-700">
                              {t("profile_settings.fiscal_year_label") ||
                                "Fiscal Year"}{" "}
                              {getFiscalYearLabel(yr, language)}
                            </Text>
                            {isCurrent && (
                              <View className="ml-2 px-2 py-0.5 rounded-full bg-slate-100">
                                <Text className="text-[11px] font-normal text-slate-500">
                                  {t("profile_settings.current_year_badge") ||
                                    "Current"}
                                </Text>
                              </View>
                            )}
                          </View>
                          <ChevronRight size={16} color="#CBD5E1" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (() => {
                const activeYear = selectedFiscalYear || getCurrentFiscalYear();
                return (
                /* ── Stage 2: choose whole year or a specific month ──── */
                <>
                  {/* Back to years */}
                  <TouchableOpacity
                    onPress={() => setSelectedFiscalYear(null)}
                    activeOpacity={0.6}
                    className="flex-row items-center mb-3"
                  >
                    <ChevronLeft size={16} color="#64748B" />
                    <Text className="text-[13px] font-normal text-slate-500 ml-1">
                      {t("profile_settings.choose_fiscal_year") ||
                        "Choose a fiscal year"}
                    </Text>
                  </TouchableOpacity>

                  {/* Download the whole fiscal year */}
                  <TouchableOpacity
                    onPress={() => onMonthSelected({ year: activeYear })}
                    activeOpacity={0.6}
                    className="flex-row items-center justify-between px-4 py-3.5 mb-5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-[15px] font-normal text-slate-700">
                        {t("profile_settings.download_year_data") ||
                          "Download This Fiscal Year's Data"}
                      </Text>
                      <Text className="text-[12px] text-slate-400 mt-0.5">
                        {`${t("profile_settings.download_year_data_subtitle") || "Export all 12 months of"} ${getFiscalYearLabel(activeYear, language)}`}
                      </Text>
                    </View>
                    <Download size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* Month selection is offered for every report except
                      "Collected Data", which downloads a whole fiscal year. */}
                  {pendingExportKey !== "collected_data" ? (
                    <>
                      <Text className="text-[12px] font-normal text-slate-400 mb-3">
                        {t("profile_settings.choose_month") ||
                          "Or choose a specific month"}
                      </Text>

                      {/* Month grid (fiscal order: Shrawan → Ashadh) */}
                      <View className="flex-row flex-wrap gap-2.5 pb-8">
                        {FISCAL_MONTH_ORDER.map((monthNum, idx) => {
                          const fiscalPos = idx + 1; // 1 = Shrawan … 12 = Ashadh
                          const isCurrentFy =
                            activeYear === getCurrentFiscalYear();
                          const isFuture =
                            isCurrentFy &&
                            fiscalPos > getCurrentFiscalMonth();
                      const monthLabel =
                        language === "np"
                          ? NepaliMonthNamesNp[monthNum - 1]
                          : NepaliMonthNames[monthNum - 1];
                      // Calendar year the month falls in within the fiscal year
                      const calendarYear =
                        monthNum >= 4 ? activeYear : activeYear + 1;
                      const yearLabel =
                        language === "np"
                          ? convertToNepaliNumber(calendarYear)
                          : String(calendarYear);
                      return (
                        <TouchableOpacity
                          key={monthNum}
                          onPress={() =>
                            !isFuture &&
                            onMonthSelected({
                              year: activeYear,
                              month: monthNum,
                            })
                          }
                          disabled={isFuture}
                          activeOpacity={isFuture ? 1 : 0.6}
                          className={`w-[31%] py-3 rounded-xl border items-center ${
                            isFuture
                              ? "border-slate-100 bg-slate-50"
                              : "border-slate-100 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-[14px] font-normal ${
                              isFuture ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            {monthLabel}
                          </Text>
                          <Text className="text-[11px] text-slate-400 mt-1">
                            {isFuture
                              ? t("profile_settings.coming_soon") ||
                                "Coming soon"
                              : yearLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                      </View>
                    </>
                  ) : null}
                </>
                );
              })()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
